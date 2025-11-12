# Social RSS Feed - Project TODO

## Architecture: Hobby Plus Ultra ($0)
- Vercel (Next.js) + Supabase (DB + Auth) + GitHub Actions (Cron) + RSS-Bridge (Scraping)

## Phase 1: Database & Authentication Setup
- [x] Configure Supabase (create project, get connection string)
- [x] Create database schema (feeds, posts, users tables)
- [x] Integrate Supabase Auth (replace Manus Auth)
- [x] Create auth endpoints (login, register, logout)

## Phase 2: Frontend Adaptation
- [x] Adapt HTML/CSS/JS from provided file to Next.js structure
- [x] Create Feed page component
- [x] Create Add Feed form component
- [x] Create Gemini Modal component
- [x] Implement localStorage → Supabase data fetching

## Phase 3: Backend API Endpoints
- [x] POST /api/feeds - Add new feed URL
- [x] GET /api/feeds - List user's feeds
- [x] DELETE /api/feeds/:id - Remove feed
- [x] GET /api/posts - Get aggregated posts
- [x] POST /api/gemini/summarize-feed - Summarize entire feed
- [x] POST /api/gemini/summarize-post - Summarize single post
- [x] POST /api/gemini/suggest-reply - Suggest responses
- [x] POST /api/cron/trigger - Cron endpoint for GitHub Actions

## Phase 4: RSS-Bridge Integration
- [x] Create RSS-Bridge fetcher utility
- [x] Parse RSS-Bridge JSON responses
- [x] Map social media data to internal post format
- [x] Handle multiple platforms (Instagram, Twitter, TikTok, Threads, Bluesky)

## Phase 5: Gemini AI Integration
- [x] Setup Gemini API key in environment variables
- [x] Create secure Gemini API caller (backend only)
- [x] Implement feed summarization logic
- [x] Implement post summarization logic
- [x] Implement reply suggestion logic

## Phase 6: GitHub Actions Setup
- [x] Create .github/workflows/trigger.yml
- [x] Configure cron schedule (30 min or 1h)
- [ ] Test workflow execution (after deployment)

## Phase 7: Testing & Deployment
- [x] Test authentication flow (fixed user ID validation)
- [ ] Test feed addition and retrieval (after login)
- [ ] Test Gemini endpoints (after login)
- [ ] Test RSS-Bridge integration (after login)
- [ ] Deploy to Vercel
- [ ] Verify all endpoints working in production
- [ ] Configure GitHub Actions secrets

## Known Constraints
- Vercel Hobby: 10s timeout, 1x daily cron (bypassed with GitHub Actions)
- Vercel Postgres: Paid (using Supabase instead)
- RSS-Bridge: Depends on public instances (may be unstable)
- Gemini API: Requires paid Google Cloud account with billing

## Notes
- All services must use free tiers
- No external paid dependencies
- Focus on MVP functionality first
