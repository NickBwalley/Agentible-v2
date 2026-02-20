-- =============================================================================
-- 1) Make campaigns.name NOT NULL with default for existing rows
-- =============================================================================
UPDATE public.campaigns
SET name = COALESCE(NULLIF(trim(name), ''), 'Unnamed campaign')
WHERE name IS NULL OR trim(name) = '';

ALTER TABLE public.campaigns
  ALTER COLUMN name SET DEFAULT 'Unnamed campaign',
  ALTER COLUMN name SET NOT NULL;

COMMENT ON COLUMN public.campaigns.name IS 'User-facing campaign name for tracking and display.';

-- =============================================================================
-- 2) View: leads with campaign name (for queries and UI)
-- =============================================================================
CREATE OR REPLACE VIEW public.leads_with_campaign_name AS
SELECT
  l.id,
  l.user_id,
  l.lead_batch_id,
  l.campaign_id,
  c.name AS campaign_name,
  l.full_name,
  l.email,
  l.email_status,
  l.linkedin_url,
  l.position,
  l.country,
  l.org_name,
  l.org_description,
  l.org_website,
  l.created_at
FROM public.leads l
LEFT JOIN public.campaigns c ON c.id = l.campaign_id;

COMMENT ON VIEW public.leads_with_campaign_name IS 'Leads joined with campaign name for display and reporting. RLS on underlying tables applies.';
