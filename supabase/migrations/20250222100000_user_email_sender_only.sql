-- Allow "sender email only" mode: user provides email + terms; sending uses app servers (no SMTP).
ALTER TABLE public.user_email_config
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

ALTER TABLE public.user_email_config
  ALTER COLUMN smtp_host DROP NOT NULL,
  ALTER COLUMN smtp_port DROP NOT NULL,
  ALTER COLUMN smtp_secure DROP NOT NULL,
  ALTER COLUMN smtp_user DROP NOT NULL,
  ALTER COLUMN smtp_password_encrypted DROP NOT NULL;

COMMENT ON COLUMN public.user_email_config.terms_accepted_at IS 'When user accepted terms for using app servers to send (sender-email-only mode).';
