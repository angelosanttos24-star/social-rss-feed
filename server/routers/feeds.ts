import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { supabaseAdmin } from '../supabase';
import { fetchFromRSSBridge, convertRSSBridgePost } from '../api/rss-bridge';

export const feedsRouter = router({
  /**
   * List all feeds for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await supabaseAdmin
      .from('feeds')
      .select('*')
      .eq('user_id', ctx.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch feeds: ${error.message}`);
    }

    return data || [];
  }),

  /**
   * Add a new feed
   */
  add: protectedProcedure
    .input(
      z.object({
        platform: z.enum(['instagram', 'twitter', 'tiktok', 'threads', 'bluesky']),
        profileUrl: z.string().url(),
        username: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Extract username from URL if needed
      const username = input.username || input.profileUrl.split('/').filter(Boolean).pop() || 'unknown';

      // Insert feed into database
      const { data, error } = await supabaseAdmin
        .from('feeds')
        .insert({
          user_id: ctx.user.id,
          platform: input.platform,
          profile_url: input.profileUrl,
          username: username,
          avatar_url: null,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to add feed: ${error.message}`);
      }

      // Fetch initial posts from RSS-Bridge
      try {
        const posts = await fetchFromRSSBridge(input.platform, username);

        // Convert and insert posts
        const postsToInsert = posts.slice(0, 10).map((post) =>
          convertRSSBridgePost(post, input.platform, data.id)
        );

        if (postsToInsert.length > 0) {
          await supabaseAdmin.from('posts').insert(postsToInsert);
        }
      } catch (error) {
        console.warn(`Failed to fetch initial posts for ${input.platform}/${username}:`, error);
        // Don't fail the feed creation if initial fetch fails
      }

      return data;
    }),

  /**
   * Delete a feed
   */
  delete: protectedProcedure
    .input(z.object({ feedId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const { data: feed, error: fetchError } = await supabaseAdmin
        .from('feeds')
        .select('user_id')
        .eq('id', input.feedId)
        .single();

      if (fetchError || feed?.user_id !== ctx.user.id) {
        throw new Error('Feed not found or unauthorized');
      }

      // Delete feed (posts will be deleted by cascade)
      const { error } = await supabaseAdmin
        .from('feeds')
        .delete()
        .eq('id', input.feedId);

      if (error) {
        throw new Error(`Failed to delete feed: ${error.message}`);
      }

      return { success: true };
    }),

  /**
   * Get posts for all user's feeds
   */
  getPosts: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get user's feed IDs
      const { data: feeds, error: feedsError } = await supabaseAdmin
        .from('feeds')
        .select('id')
        .eq('user_id', ctx.user.id);

      if (feedsError) {
        throw new Error(`Failed to fetch feeds: ${feedsError.message}`);
      }

      const feedIds = feeds?.map((f) => f.id) || [];

      if (feedIds.length === 0) {
        return [];
      }

      // Get posts from all feeds
      const { data, error } = await supabaseAdmin
        .from('posts')
        .select('*')
        .in('feed_id', feedIds)
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (error) {
        throw new Error(`Failed to fetch posts: ${error.message}`);
      }

      return data || [];
    }),
});
