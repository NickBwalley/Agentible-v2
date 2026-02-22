-- Ensure message_id exists and document usage: outbound = our Message-ID (for reply matching); inbound = reply's Message-ID (for dedupe).
ALTER TABLE public.outreach_messages
  ADD COLUMN IF NOT EXISTS message_id text;

CREATE INDEX IF NOT EXISTS idx_outreach_messages_message_id
  ON public.outreach_messages(message_id)
  WHERE message_id IS NOT NULL;

COMMENT ON COLUMN public.outreach_messages.message_id IS 'Outbound: our Message-ID header for In-Reply-To matching. Inbound: reply Message-ID for deduplication.';
