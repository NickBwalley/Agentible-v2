-- Campaign send results: one row per lead per send (agentible SMTP).
-- Tracks accepted (sent) vs rejected (not-sent) from webhook response.
CREATE TABLE IF NOT EXISTS public.campaign_send_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('sent', 'not-sent')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_send_results_campaign_id ON public.campaign_send_results(campaign_id);
CREATE INDEX idx_campaign_send_results_lead_id ON public.campaign_send_results(lead_id);
CREATE INDEX idx_campaign_send_results_created_at ON public.campaign_send_results(created_at DESC);

COMMENT ON TABLE public.campaign_send_results IS 'Per-lead send outcome from agentible SMTP webhook: sent (accepted) or not-sent (rejected).';

ALTER TABLE public.campaign_send_results ENABLE ROW LEVEL SECURITY;

-- Users can only see/insert results for their own campaigns
CREATE POLICY "campaign_send_results_select_own"
  ON public.campaign_send_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_send_results.campaign_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "campaign_send_results_insert_own"
  ON public.campaign_send_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_send_results.campaign_id AND c.user_id = auth.uid()
    )
  );
