-- =============================================================================
-- Outreach messages: copy of each outbound (and later inbound) email per lead.
-- One row per sent/received message; used for thread view and reply matching.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.outreach_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  subject text NOT NULL DEFAULT '',
  body_plain text NOT NULL DEFAULT '',
  message_id text,
  sent_at timestamptz,
  received_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_outreach_messages_user_id ON public.outreach_messages(user_id);
CREATE INDEX idx_outreach_messages_campaign_id ON public.outreach_messages(campaign_id);
CREATE INDEX idx_outreach_messages_lead_id ON public.outreach_messages(lead_id);
CREATE INDEX idx_outreach_messages_sent_at ON public.outreach_messages(sent_at DESC);
CREATE INDEX idx_outreach_messages_message_id ON public.outreach_messages(message_id) WHERE message_id IS NOT NULL;

COMMENT ON TABLE public.outreach_messages IS 'Per-message copy of outbound/inbound emails for thread view and reply tracking.';

ALTER TABLE public.outreach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "outreach_messages_select_own"
  ON public.outreach_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "outreach_messages_insert_own"
  ON public.outreach_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.leads l WHERE l.id = lead_id AND l.user_id = auth.uid())
  );

-- No UPDATE/DELETE policies: messages are append-only.
