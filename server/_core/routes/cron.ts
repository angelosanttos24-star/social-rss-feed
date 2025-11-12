import { Router } from 'express';
import { supabaseAdmin } from '../../supabase';
import { fetchFromRSSBridge, convertRSSBridgePost } from '../../api/rss-bridge';

const router = Router();

/**
 * Cron trigger endpoint - called by GitHub Actions
 * This endpoint updates all feeds by fetching new posts from RSS-Bridge
 */
router.post('/trigger', async (req, res) => {
  try {
    const secret = req.headers['x-cron-secret'];
    const expectedSecret = process.env.CRON_SECRET || 'default-secret';

    // Simple secret validation
    if (secret !== expectedSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[CRON] Starting feed update...');

    // Get all feeds
    const { data: feeds, error: feedsError } = await supabaseAdmin
      .from('feeds')
      .select('*');

    if (feedsError) {
      throw new Error(`Failed to fetch feeds: ${feedsError.message}`);
    }

    if (!feeds || feeds.length === 0) {
      return res.json({ message: 'No feeds to update', updated: 0 });
    }

    let totalUpdated = 0;

    // Update each feed
    for (const feed of feeds) {
      try {
        console.log(`[CRON] Updating feed: ${feed.platform}/${feed.username}`);

        // Fetch posts from RSS-Bridge
        const posts = await fetchFromRSSBridge(feed.platform, feed.username);

        if (!posts || posts.length === 0) {
          console.warn(`[CRON] No posts found for ${feed.platform}/${feed.username}`);
          continue;
        }

        // Convert posts to our format
        const postsToInsert = posts
          .slice(0, 20) // Limit to 20 posts per feed
          .map((post) => convertRSSBridgePost(post, feed.platform, feed.id));

        // Insert posts (duplicates will be ignored due to UNIQUE constraint)
        const { error: insertError } = await supabaseAdmin
          .from('posts')
          .insert(postsToInsert);

        if (insertError && !insertError.message.includes('duplicate')) {
          console.error(`[CRON] Failed to insert posts for ${feed.id}:`, insertError);
        } else {
          totalUpdated++;
          console.log(`[CRON] Updated ${postsToInsert.length} posts for ${feed.platform}/${feed.username}`);
        }
      } catch (error) {
        console.error(`[CRON] Error updating feed ${feed.id}:`, error);
        // Continue with next feed
      }
    }

    console.log(`[CRON] Completed. Updated ${totalUpdated}/${feeds.length} feeds`);

    res.json({
      message: 'Cron job completed',
      updated: totalUpdated,
      total: feeds.length,
    });
  } catch (error) {
    console.error('[CRON] Error:', error);
    res.status(500).json({
      error: 'Cron job failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
