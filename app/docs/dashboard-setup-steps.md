# Dashboard Setup Steps

This document describes the steps required to set up and use the Agentible MVP dashboard (lead response SLA monitor) with **HubSpot**, **Salesforce**, and **Google Drive** integrations, dark theme, and correct auth redirects.

---

## 1. Database migration

Run the MVP dashboard schema migration so the app has the `leads`, `alerts` tables and the extended `users` columns (CRM and SLA fields).

**Steps:**

1. Ensure Supabase is linked to your project (e.g. `supabase link` if using Supabase CLI).
2. Run the migration:
   - **CLI:** `pnpm supabase db push` (or `npx supabase db push`) from the project root.
   - **Or:** In the [Supabase Dashboard](https://app.supabase.com) → SQL Editor, run the contents of:
     - `supabase/migrations/20250219100000_mvp_dashboard_schema.sql`

This migration:

- Adds to `users`: `crm_provider`, `crm_connected`, `sla_target_minutes`, `api_key`, `routing_enabled`, `routing_method`.
- Creates `leads` and `alerts` with RLS and indexes.

---

## 2. Environment variables

In `.env.local` (see `.env.local.example` for a template):

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |

Optional (for future OAuth integrations):

- `HUBSPOT_CLIENT_ID` / `HUBSPOT_CLIENT_SECRET` – HubSpot OAuth
- Salesforce OAuth client id/secret (when implemented)
- Google Drive / Google OAuth client id/secret (when implemented)

---

## 3. Auth and redirect behavior

The app is configured so that:

- **Logged-in users** are sent to **`/dashboard`**:
  - After **email/password login** (signin page).
  - After **OAuth callback** (e.g. Google sign-in): default redirect is `/dashboard` (overridable via `?next=...`).
  - After **signup** when a session is created immediately.
- **Visiting the home page (`/`) while logged in** redirects to **`/dashboard`**.
- **Not logged in:** Home page (`/`) shows the landing (Hero, Pricing). Visiting `/dashboard` or `/onboarding` redirects to **`/signin`**.

No extra configuration is required for this behavior.

---

## 4. Integrations: HubSpot, Salesforce, Google Drive

The onboarding flow offers three options:

1. **HubSpot**
2. **Salesforce**
3. **Google Drive**

Selecting an option currently **marks the user as “CRM connected”** in the database (sets `users.crm_provider` and `users.crm_connected`). Real OAuth and syncing are not implemented in the MVP; the UI and data model are ready for you to plug in:

- **HubSpot:** Use HubSpot OAuth (e.g. redirect to HubSpot, handle callback, store token in `users.api_key` or a separate tokens table). Then call HubSpot APIs to sync leads into `leads`.
- **Salesforce:** Same idea with Salesforce OAuth and APIs.
- **Google Drive:** Use Google OAuth (same client can be used for Drive and Gmail if needed). Store token and sync/copy relevant files or metadata as needed for your product.

Recommended next steps:

1. Create OAuth apps in each provider’s developer console.
2. Add callback routes (e.g. `/api/crm/connect` or provider-specific routes) that:
   - Exchange the code for tokens.
   - Save tokens securely (e.g. encrypted in `users.api_key` or a dedicated table).
3. Implement sync logic (cron or on-demand) that reads from the provider and writes to `leads` (and optionally `alerts`).

---

## 5. Theme

The dashboard and onboarding use a **dark theme** consistent with the rest of the app:

- Background: `#0f1419`
- Cards/surfaces: `border-white/10`, `bg-white/5`
- Text: `text-white`, `text-white/70`, etc.
- Metrics and alerts use semantic colors (e.g. emerald for good, red for breach) that work on dark.

No configuration is required; it’s built into the components and pages.

---

## 6. Step-by-step checklist

- [ ] Run the migration `20250219100000_mvp_dashboard_schema.sql` (see §1).
- [ ] Set Supabase env vars in `.env.local` (see §2).
- [ ] (Optional) Configure HubSpot/Salesforce/Google OAuth apps and env vars for future API integration.
- [ ] Sign up or log in and confirm you are redirected to `/dashboard`.
- [ ] Log out, open `/`, and confirm you see the landing page (no redirect to dashboard).
- [ ] From dashboard, open **Onboarding** and connect one of HubSpot, Salesforce, or Google Drive (MVP only flags the choice; no live sync yet).
- [ ] Complete onboarding (SLA target and routing preference), then confirm you land back on the dashboard with dark theme and empty state or metrics as expected.

---

## 7. Optional: OAuth callback URL for CRM

When you implement real OAuth for HubSpot, Salesforce, or Google:

1. In each provider’s app settings, set the redirect/callback URL to your app (e.g. `https://yourdomain.com/auth/callback` or a dedicated route like `https://yourdomain.com/api/crm/connect`).
2. Ensure the same URL (and origin) is used in the client when starting the OAuth flow (e.g. `redirectTo` in `signInWithOAuth` or your own link).

For local development, use `http://localhost:3000/...` and add it to the provider’s allowed redirect URIs.
