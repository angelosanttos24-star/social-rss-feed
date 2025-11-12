import axios from 'axios';

// List of public RSS-Bridge instances (can be extended)
const RSS_BRIDGE_INSTANCES = [
  'https://rss-bridge.org',
  'https://bridge.suumitsu.eu',
  'https://rss.nixnet.services',
];

export interface RSSBridgePost {
  title?: string;
  content?: string;
  uri?: string;
  timestamp?: number;
  author?: string;
  avatar?: string;
  enclosures?: Array<{
    url: string;
    type: string;
  }>;
}

export interface RSSBridgeResponse {
  items: RSSBridgePost[];
}

/**
 * Fetch posts from a social media profile using RSS-Bridge
 * @param platform - Social media platform (instagram, twitter, tiktok, threads, bluesky)
 * @param username - Username/profile identifier
 * @returns Array of posts from RSS-Bridge
 */
export async function fetchFromRSSBridge(
  platform: string,
  username: string
): Promise<RSSBridgePost[]> {
  // Map platform names to RSS-Bridge bridge names
  const bridgeMap: Record<string, string> = {
    instagram: 'Instagram',
    twitter: 'Twitter',
    tiktok: 'TikTok',
    threads: 'Threads',
    bluesky: 'BlueSky',
  };

  const bridgeName = bridgeMap[platform.toLowerCase()];
  if (!bridgeName) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  // Try each RSS-Bridge instance until one works
  for (const instance of RSS_BRIDGE_INSTANCES) {
    try {
      const url = new URL(`${instance}/feeds/${bridgeName}.json`);
      
      // Add platform-specific parameters
      if (platform.toLowerCase() === 'instagram') {
        url.searchParams.append('u', username);
      } else if (platform.toLowerCase() === 'twitter') {
        url.searchParams.append('u', username);
      } else if (platform.toLowerCase() === 'tiktok') {
        url.searchParams.append('u', username);
      } else if (platform.toLowerCase() === 'threads') {
        url.searchParams.append('u', username);
      } else if (platform.toLowerCase() === 'bluesky') {
        url.searchParams.append('u', username);
      }

      const response = await axios.get<RSSBridgeResponse>(url.toString(), {
        timeout: 10000, // 10 second timeout
      });

      if (response.data && response.data.items) {
        return response.data.items;
      }
    } catch (error) {
      console.warn(`RSS-Bridge instance ${instance} failed:`, error);
      // Try next instance
      continue;
    }
  }

  throw new Error(`Failed to fetch from RSS-Bridge for ${platform}/${username}`);
}

/**
 * Convert RSS-Bridge post to our internal post format
 */
export function convertRSSBridgePost(
  rssPost: RSSBridgePost,
  platform: string,
  feedId: string
) {
  return {
    feed_id: feedId,
    platform: platform.toLowerCase(),
    platform_post_id: rssPost.uri || `${Date.now()}-${Math.random()}`,
    username: rssPost.author || 'Unknown',
    avatar_url: rssPost.avatar || null,
    media_type: rssPost.enclosures && rssPost.enclosures.length > 0 ? 'image' : 'text',
    media_url: rssPost.enclosures?.[0]?.url || null,
    description: rssPost.content || rssPost.title || '',
    likes: 0, // RSS-Bridge doesn't provide engagement metrics
    comments: 0,
    created_at: new Date(rssPost.timestamp ? rssPost.timestamp * 1000 : Date.now()),
  };
}
