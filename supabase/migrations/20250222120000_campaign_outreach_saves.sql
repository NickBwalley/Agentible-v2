-- =============================================================================
-- Campaign outreach saves: per-campaign cold outreach brief + email template.
-- One row per (user_id, campaign_id); optional lead_batch_id for traceability.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_outreach_saves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  lead_batch_id uuid REFERENCES public.lead_batches(id) ON DELETE SET NULL,
  -- Brief (section 1): problems & solution, offer
  icp_description text,
  offer_description text,
  -- Template (section 2): subject + body
  subject_template text,
  body_template text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, campaign_id)
);

CREATE INDEX idx_campaign_outreach_saves_user_id ON public.campaign_outreach_saves(user_id);
CREATE INDEX idx_campaign_outreach_saves_campaign_id ON public.campaign_outreach_saves(campaign_id);
CREATE INDEX idx_campaign_outreach_saves_lead_batch_id ON public.campaign_outreach_saves(lead_batch_id);

COMMENT ON TABLE public.campaign_outreach_saves IS 'Saved cold outreach brief (ICP + offer) and email template per campaign; one row per user+campaign.';

-- RLS: user can only access their own saves (campaign must belong to user)
ALTER TABLE public.campaign_outreach_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_outreach_saves_select_own"
  ON public.campaign_outreach_saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "campaign_outreach_saves_insert_own"
  ON public.campaign_outreach_saves FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.campaigns c
      WHERE c.id = campaign_id AND c.user_id = auth.uid()
    )
    AND (lead_batch_id IS NULL OR EXISTS (
      SELECT 1 FROM public.lead_batches lb
      WHERE lb.id = lead_batch_id AND lb.user_id = auth.uid()
    ))
  );

CREATE POLICY "campaign_outreach_saves_update_own"
  ON public.campaign_outreach_saves FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campaign_outreach_saves_delete_own"
  ON public.campaign_outreach_saves FOR DELETE
  USING (auth.uid() = user_id);

-- Optional: keep updated_at in sync (application can set it on upsert)
CREATE OR REPLACE FUNCTION public.set_campaign_outreach_saves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER campaign_outreach_saves_updated_at
  BEFORE UPDATE ON public.campaign_outreach_saves
  FOR EACH ROW
  EXECUTE FUNCTION public.set_campaign_outreach_saves_updated_at();
