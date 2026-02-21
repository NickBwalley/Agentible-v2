-- Per-user email (SMTP/IMAP) config for sending campaigns. RLS by user_id.
CREATE TABLE IF NOT EXISTS public.user_email_config (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  smtp_host text NOT NULL,
  smtp_port integer NOT NULL DEFAULT 587,
  smtp_secure boolean NOT NULL DEFAULT true,
  smtp_user text NOT NULL,
  smtp_password_encrypted text NOT NULL,
  from_email text NOT NULL,
  imap_host text,
  imap_port integer,
  imap_user text,
  imap_password_encrypted text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_email_config_user_id ON public.user_email_config(user_id);

ALTER TABLE public.user_email_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_email_config_select_own"
  ON public.user_email_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_email_config_insert_own"
  ON public.user_email_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_email_config_update_own"
  ON public.user_email_config FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.user_email_config IS 'Per-user SMTP (and optional IMAP) config for sending campaign emails. Passwords stored encrypted.';
