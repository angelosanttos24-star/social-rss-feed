import { z } from 'zod';
import { protectedProcedure, router } from '../_core/trpc';
import { supabaseAdmin } from '../supabase';
import { summarizeFeed, summarizePost, suggestReplies } from '../api/gemini';

// Helper to validate user ID
function isValidUserId(id: any): id is string {
  return typeof id === 'string' && id.length > 0 && id !== '1' && /^[0-9a-f-]+$/i.test(id);
}

export const geminiRouter = router({
  /**
   * Summarize entire feed using Gemini
   */
  summarizeFeed: protectedProcedure.mutation(async ({ ctx }) => {
    // Validate user ID
    if (!isValidUserId(ctx.user?.id)) {
      return { summary: 'Please log in to use this feature.' };
    }

    // Get user's feeds
    const { data: feeds, error: feedsError } = await supabaseAdmin
      .from('feeds')
      .select('id')
      .eq('user_id', ctx.user.id);

    if (feedsError) {
      console.error('Supabase error:', feedsError);
      return { summary: 'No feeds available to summarize.' };
    }

    const feedIds = feeds?.map((f) => f.id) || [];

    if (feedIds.length === 0) {
      return { summary: 'No feeds available to summarize.' };
    }

    // Get recent posts
    const { data: posts, error: postsError } = await supabaseAdmin
      .from('posts')
      .select('*')
      .in('feed_id', feedIds)
      .order('created_at', { ascending: false })
      .limit(20);

    if (postsError || !posts || posts.length === 0) {
      return { summary: 'No posts available to summarize.' };
    }

    // Call Gemini
    const summary = await summarizeFeed(
      posts.map((p) => ({
        username: p.username || 'Unknown',
        platform: p.platform,
        description: p.description || '',
      }))
    );

    return { summary };
  }),

  /**
   * Summarize a single post using Gemini
   */
  summarizePost: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Validate user ID
      if (!isValidUserId(ctx.user?.id)) {
        throw new Error('Please log in to use this feature.');
      }

      // Get the post
      const { data: posts, error: postsError } = await supabaseAdmin
        .from('posts')
        .select('id, description, feed_id')
        .eq('id', input.postId)
        .limit(1);

      if (postsError || !posts || posts.length === 0) {
        throw new Error('Post not found');
      }

      const post = posts[0];

      // Verify user owns the feed
      const { data: feed, error: feedError } = await supabaseAdmin
        .from('feeds')
        .select('user_id')
        .eq('id', post.feed_id)
        .single();

      if (feedError || feed?.user_id !== ctx.user.id) {
        throw new Error('Post not found or unauthorized');
      }

      // Call Gemini
      const summary = await summarizePost(post.description || '');

      return { summary };
    }),

  /**
   * Suggest replies for a post using Gemini
   */
  suggestReplies: protectedProcedure
    .input(z.object({ postId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Validate user ID
      if (!isValidUserId(ctx.user?.id)) {
        throw new Error('Please log in to use this feature.');
      }

      // Get the post
      const { data: posts, error: postsError } = await supabaseAdmin
        .from('posts')
        .select('id, description, feed_id')
        .eq('id', input.postId)
        .limit(1);

      if (postsError || !posts || posts.length === 0) {
        throw new Error('Post not found');
      }

      const post = posts[0];

      // Verify user owns the feed
      const { data: feed, error: feedError } = await supabaseAdmin
        .from('feeds')
        .select('user_id')
        .eq('id', post.feed_id)
        .single();

      if (feedError || feed?.user_id !== ctx.user.id) {
        throw new Error('Post not found or unauthorized');
      }

      // Call Gemini
      const suggestions = await suggestReplies(post.description || '');

      return { suggestions };
    }),
});
