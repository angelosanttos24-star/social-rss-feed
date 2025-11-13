import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { supabaseAdmin } from "../supabase";
import { getUserId, ensureUserInSupabase } from "../api/user-mapping";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Ensure user exists in Supabase
      try {
        // Extract numeric ID from openId or use a hash
        const userId = parseInt(userInfo.openId.substring(0, 10), 36) || Math.abs(userInfo.openId.length * 31);
        await ensureUserInSupabase(
          supabaseAdmin,
          userId,
          userInfo.openId,
          userInfo.email || undefined,
          userInfo.name || undefined
        );
        console.log("[OAuth] User created in Supabase:", { userId, openId: userInfo.openId });
      } catch (supabaseError) {
        console.error("[OAuth] Failed to create user in Supabase:", supabaseError);
        // Don't fail the OAuth flow if Supabase creation fails
      }

      // Try to upsert to local database (optional)
      try {
        await db.upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: new Date(),
        });
      } catch (dbError) {
        console.warn("[OAuth] Failed to upsert to local database:", dbError);
        // Don't fail the OAuth flow if local database upsert fails
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed", details: String(error) });
    }
  });
}
