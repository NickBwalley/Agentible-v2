-- =============================================================================
-- Outbound Leads MVP: minimal schema + RLS for campaigns, lead_batches, leads,
-- and audit_events. Auth via Supabase Auth; user id = auth.uid().
-- =============================================================================
-- NOTE: If you already have public.leads from another migration (e.g. MVP
-- dashboard), drop or rename that table before running this, or run in a fresh
-- project.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) CAMPAIGNS
-- One per user; optional parent for batches and leads. Status drives workflow.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready', 'running', 'paused', 'done')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaigns_user_id ON public.campaigns(user_id);

COMMENT ON TABLE public.campaigns IS 'User-owned campaigns; status: draft, ready, running, paused, done.';

-- -----------------------------------------------------------------------------
-- 2) LEAD_BATCHES
-- One row per fetch/verify run; optionally tied to a campaign. Tracks when
-- and from which query leads were generated.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lead_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  query_or_source text,
  csv_path text
);

CREATE INDEX idx_lead_batches_user_id ON public.lead_batches(user_id);
CREATE INDEX idx_lead_batches_campaign_id ON public.lead_batches(campaign_id);

COMMENT ON TABLE public.lead_batches IS 'One batch per lead generation/verification run; optional campaign and csv_path for exports.';
COMMENT ON COLUMN public.lead_batches.csv_path IS 'Optional path in storage bucket for exported CSV (e.g. ${user_id}/exports/...).';

-- -----------------------------------------------------------------------------
-- 3) LEADS
-- Cleaned lead records; tied to user and optionally to campaign and batch.
-- Email is stored as given; uniqueness and lookups use lowercased email per user.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_batch_id uuid REFERENCES public.lead_batches(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  full_name text,
  email text NOT NULL,
  email_normalized text GENERATED ALWAYS AS (lower(email)) STORED,
  email_status text NOT NULL DEFAULT 'unknown'
    CHECK (email_status IN ('valid', 'risky', 'invalid', 'unknown')),
  linkedin_url text,
  position text,
  country text,
  org_name text,
  org_description text,
  org_website text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, email_normalized)
);

CREATE INDEX idx_leads_user_id ON public.leads(user_id);
CREATE INDEX idx_leads_lead_batch_id ON public.leads(lead_batch_id);
CREATE INDEX idx_leads_campaign_id ON public.leads(campaign_id);

COMMENT ON TABLE public.leads IS 'Cleaned leads; one per user+email (by lower email). Optional batch and campaign.';
COMMENT ON COLUMN public.leads.email_normalized IS 'Lowercased email for uniqueness and lookups; enforced unique per user_id.';

-- -----------------------------------------------------------------------------
-- 4) AUDIT_EVENTS
-- Activity log: who did what, when; optional campaign context.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_events_user_id ON public.audit_events(user_id);
CREATE INDEX idx_audit_events_campaign_id ON public.audit_events(campaign_id);
CREATE INDEX idx_audit_events_created_at ON public.audit_events(created_at DESC);

COMMENT ON TABLE public.audit_events IS 'Audit log: user actions with optional campaign context.';

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CAMPAIGNS: user can CRUD only their own campaigns
-- -----------------------------------------------------------------------------
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select_own"
  ON public.campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "campaigns_insert_own"
  ON public.campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campaigns_update_own"
  ON public.campaigns FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "campaigns_delete_own"
  ON public.campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- LEAD_BATCHES: user can CRUD only their own; campaign_id only if campaign
-- belongs to the same user
-- -----------------------------------------------------------------------------
ALTER TABLE public.lead_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_batches_select_own"
  ON public.lead_batches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "lead_batches_insert_own"
  ON public.lead_batches FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      campaign_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.campaigns c
        WHERE c.id = campaign_id AND c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "lead_batches_update_own"
  ON public.lead_batches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      campaign_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.campaigns c
        WHERE c.id = campaign_id AND c.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "lead_batches_delete_own"
  ON public.lead_batches FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- LEADS: user can CRUD only their own; insert must have user_id = auth.uid()
-- -----------------------------------------------------------------------------
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_select_own"
  ON public.leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "leads_insert_own"
  ON public.leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "leads_update_own"
  ON public.leads FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "leads_delete_own"
  ON public.leads FOR DELETE
  USING (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- AUDIT_EVENTS: user can read only their own; insert only when user_id = auth.uid()
-- -----------------------------------------------------------------------------
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_events_select_own"
  ON public.audit_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "audit_events_insert_own"
  ON public.audit_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE/DELETE policies: audit log is append-only (no update or delete).

-- =============================================================================
-- BULK INSERT EXAMPLE
-- One batch and two leads tied to that batch and user. Run with a real
-- auth.uid() or replace :user_id / :batch_id in your app.
-- =============================================================================
/*
-- Step 1: Insert one batch (get id from returning or from app)
INSERT INTO public.lead_batches (user_id, campaign_id, query_or_source)
VALUES (auth.uid(), NULL, 'LinkedIn search: VP Sales USA')
RETURNING id;

-- Step 2: Insert many leads for that batch (use the id from step 1 as lead_batch_id)
INSERT INTO public.leads (
  user_id,
  lead_batch_id,
  campaign_id,
  full_name,
  email,
  email_status,
  linkedin_url,
  position,
  country,
  org_name,
  org_description,
  org_website
) VALUES
  (
    auth.uid(),
    '00000000-0000-0000-0000-000000000001'::uuid,  -- replace with actual lead_batch id
    NULL,
    'Jane Doe',
    'jane.doe@company.com',
    'valid',
    'https://linkedin.com/in/janedoe',
    'VP Sales',
    'USA',
    'Acme Inc',
    'B2B SaaS',
    'https://acme.com'
  ),
  (
    auth.uid(),
    '00000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    'John Smith',
    'john@startup.io',
    'risky',
    'https://linkedin.com/in/johnsmith',
    'Head of Growth',
    'UK',
    'Startup IO',
    'Growth platform',
    'https://startup.io'
  );
*/

-- =============================================================================
-- OPTIONAL: Storage bucket for exported CSVs
-- Path prefix: ${auth.uid()}/... so users can read/write only their own files.
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lead-exports',
  'lead-exports',
  false,
  52428800,
  ARRAY['text/csv', 'application/csv']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- RLS: user can read/write only objects under path prefix ${auth.uid()}/...
CREATE POLICY "lead_exports_select_own"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'lead-exports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "lead_exports_insert_own"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lead-exports'
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "lead_exports_update_own"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'lead-exports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "lead_exports_delete_own"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lead-exports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
