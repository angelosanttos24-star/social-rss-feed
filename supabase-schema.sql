-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create feeds table
CREATE TABLE IF NOT EXISTS public.feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL, -- 'instagram', 'twitter', 'tiktok', 'threads', 'bluesky'
  profile_url VARCHAR(500) NOT NULL,
  username VARCHAR(255),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, profile_url)
);

-- Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feed_id UUID NOT NULL REFERENCES public.feeds(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  platform_post_id VARCHAR(255),
  username VARCHAR(255),
  avatar_url VARCHAR(500),
  media_type VARCHAR(50), -- 'image', 'video', 'carousel', 'text'
  media_url VARCHAR(500),
  description TEXT,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  fetched_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(feed_id, platform_post_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feeds_user_id ON public.feeds(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_feed_id ON public.posts(feed_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for feeds table
CREATE POLICY "Users can view their own feeds" ON public.feeds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feeds" ON public.feeds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feeds" ON public.feeds
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feeds" ON public.feeds
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for posts table (users can see posts from their feeds)
CREATE POLICY "Users can view posts from their feeds" ON public.posts
  FOR SELECT USING (
    feed_id IN (
      SELECT id FROM public.feeds WHERE user_id = auth.uid()
    )
  );

-- Allow service role to insert posts (for cron jobs)
CREATE POLICY "Service role can insert posts" ON public.posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update posts" ON public.posts
  FOR UPDATE WITH CHECK (true);
