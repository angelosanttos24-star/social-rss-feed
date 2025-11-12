# Social RSS Feed - Deployment Guide

## Architecture Overview

This project uses the **"Hobby Plus Ultra"** architecture for $0 deployment:

- **Vercel**: Hosts the Next.js frontend and Express backend
- **Supabase**: Provides PostgreSQL database and authentication (free tier)
- **GitHub Actions**: Triggers feed updates every 30 minutes
- **RSS-Bridge**: Scrapes social media feeds (public instances)
- **Gemini API**: Provides AI-powered summaries and suggestions

## Prerequisites

1. **Vercel Account** (free)
2. **Supabase Account** (free)
3. **GitHub Account** (free)
4. **Google Cloud Account** with Gemini API enabled and billing configured

## Setup Instructions

### Step 1: Supabase Configuration

1. Create a project at https://supabase.com
2. Go to **SQL Editor** and run the schema from `supabase-schema.sql`
3. Get your credentials:
   - `SUPABASE_URL`: Project URL
   - `SUPABASE_ANON_KEY`: Public API key (Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key (Settings → API)

### Step 2: Gemini API Setup

1. Go to https://console.cloud.google.com
2. Enable the Generative Language API
3. Create an API key (Credentials → Create Credentials → API Key)
4. Get your `GEMINI_API_KEY`

### Step 3: Deploy to Vercel

1. Push your code to GitHub
2. Go to https://vercel.com and connect your GitHub repository
3. Add environment variables in Vercel Settings:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `CRON_SECRET`: Generate a random secret (e.g., `openssl rand -hex 32`)

4. Deploy!

### Step 4: GitHub Actions Setup

1. Go to your GitHub repository
2. Add these secrets in **Settings → Secrets and variables → Actions**:
   - `CRON_SECRET`: Same value as in Vercel
   - `VERCEL_DEPLOYMENT_URL`: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`)

3. The workflow in `.github/workflows/feed-update.yml` will run automatically every 30 minutes

## Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `SUPABASE_URL` | Supabase project URL | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase public key | `eyJhbGc...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role | `eyJhbGc...` (longer) |
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` |
| `CRON_SECRET` | Secret for cron endpoint | `abc123...` |

## API Endpoints

### Feeds Management
- `POST /api/trpc/feeds.add` - Add a new feed
- `GET /api/trpc/feeds.list` - List user's feeds
- `DELETE /api/trpc/feeds.delete` - Delete a feed
- `GET /api/trpc/feeds.getPosts` - Get all posts from user's feeds

### Gemini AI
- `POST /api/trpc/gemini.summarizeFeed` - Summarize entire feed
- `POST /api/trpc/gemini.summarizePost` - Summarize single post
- `POST /api/trpc/gemini.suggestReplies` - Suggest replies for a post

### Cron Trigger
- `POST /api/cron/trigger` - Manually trigger feed update (requires `X-Cron-Secret` header)

## Troubleshooting

### Feeds not updating
1. Check that GitHub Actions secret `VERCEL_DEPLOYMENT_URL` is correct
2. Verify `CRON_SECRET` matches in both Vercel and GitHub
3. Check Vercel logs for errors

### Gemini API errors
1. Verify `GEMINI_API_KEY` is correct
2. Check that billing is enabled on Google Cloud
3. Ensure API quota hasn't been exceeded

### Supabase connection errors
1. Verify all three Supabase keys are correct
2. Check that database schema was created successfully
3. Ensure Row Level Security policies are in place

## Cost Estimation

- **Vercel**: Free (Hobby tier)
- **Supabase**: Free (up to 500MB storage, 2GB bandwidth/month)
- **GitHub Actions**: Free (2000 minutes/month)
- **Gemini API**: Paid ($0.075 per 1M input tokens, $0.30 per 1M output tokens)
  - Typical usage: ~$1-5/month depending on feed size

**Total: ~$1-5/month** (only for Gemini API usage)

## Important Notes

- RSS-Bridge instances may be unstable. If one fails, the system automatically tries others
- Gemini API has rate limits. Large feeds may need throttling
- Supabase free tier has storage limits. Clean up old posts periodically
- GitHub Actions runs on UTC timezone

## Support

For issues or questions, check:
1. Vercel deployment logs
2. GitHub Actions workflow logs
3. Supabase database logs
4. Browser console for frontend errors
