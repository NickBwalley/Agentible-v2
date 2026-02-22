-- =============================================================================
-- Schedule reply sync every 5 minutes (pg_cron + pg_net).
-- Run this in Supabase SQL Editor after:
--   1. Enabling "pg_cron" and "pg_net" in Dashboard → Database → Extensions.
--   2. Replacing YOUR_APP_URL and YOUR_CRON_SECRET below.
--
--   YOUR_APP_URL   = your app origin, e.g. https://agentible.vercel.app
--   YOUR_CRON_SECRET = same value as CRON_SECRET in your app env.
-- =============================================================================

-- Remove existing job if re-running
SELECT cron.unschedule('sync-replies')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'sync-replies');

-- Schedule: every 5 minutes
SELECT cron.schedule(
  'sync-replies',
  '*/5 * * * *',
  $$
  SELECT net.http_get(
    url := 'https://YOUR_APP_URL/api/cron/sync-replies',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_CRON_SECRET'
    ),
    timeout_milliseconds := 60000
  ) AS request_id;
  $$
);

-- Verify: list cron jobs (should show sync-replies with schedule */5 * * * *)
-- SELECT jobname, schedule, command FROM cron.job;
