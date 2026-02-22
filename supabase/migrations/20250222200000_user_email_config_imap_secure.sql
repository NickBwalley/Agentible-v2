-- Add imap_secure to user_email_config (used by GET /api/settings/email and IMAP save).
ALTER TABLE public.user_email_config
  ADD COLUMN IF NOT EXISTS imap_secure boolean DEFAULT true;

COMMENT ON COLUMN public.user_email_config.imap_secure IS 'Use SSL/TLS for IMAP connection.';
