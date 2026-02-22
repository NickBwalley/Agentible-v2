-- =============================================================================
-- Reply sync cron: enable pg_cron and pg_net (enable via Dashboard if not already).
-- To schedule the actual job, run the SQL in: supabase/scripts/schedule-sync-replies.sql
-- after replacing YOUR_APP_URL and YOUR_CRON_SECRET.
-- =============================================================================

-- Extensions are usually enabled via Supabase Dashboard → Database → Extensions.
-- If you prefer SQL, uncomment below (may require superuser):
-- CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
-- CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- This migration is a no-op; run supabase/scripts/schedule-sync-replies.sql manually.
SELECT 1;
