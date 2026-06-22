# Building Management App

## What this is
A Progressive Web App for managing a residential building with six units. Part of Cyril's
personal life-management platform. Two audiences:
- **Landlords** (family members) log in via PIN
- **Tenants** access individual portals via unique links

Two main app components:
- `src/.../LandlordApp.jsx`
- `src/.../TenantPortal.jsx`

## Stack
- **Frontend:** React + Vite
- **Backend:** Supabase (Postgres, Edge Functions, pg_cron)
- **Deployment:** Vercel (via Vercel CLI)
- **Push notifications:** ntfy.sh (free tier), topic `building-cyril-a59e9c4aeb`
- **Supabase project ref:** `xasbqstbdhcjpujwkkhe`
- **Testing:** iOS Safari, mobile-first

## Deploy command
```
cd /Users/cyrilsmacbookair/building-app && vercel build --prod && vercel --prod --prebuilt
```

## UI direction (do not drift from this)
- Light theme: background `#f5f5f7`, indigo accent `#5046e5` (confirmed in code 2026-06-19;
  the old "dark bg + lime #c8f060" note was stale and never matched the shipped app).
- SVG bottom-nav icons. Landlord layout is **6 tabs**: Home / Units / Bills / Issues /
  Broadcast / Analytics. Tenant portal is 5 tabs: Home / Payments / Documents / Issues / Notice.
- Payment verification cards, clean status pills
- No colored emojis in the UI. (Note: WhatsApp message templates currently DO contain emojis,
  which violates this; clean up if touched.)
- Premium, smooth mobile UX is a priority

## Hard-won lessons (do not relearn these)
- Supabase Edge Functions need the **legacy anon JWT and service role JWT**. The newer
  `sb_publishable` / `sb_secret` key formats do NOT work with Edge Functions.
- Deploy Edge Functions with `--no-verify-jwt`. Internal `CRON_SECRET` auth checks caused
  401s and were removed.
- ntfy.sh free tier has no per-topic access control. Security comes from a long random
  topic name, not dashboard ACLs.
- Free-tier Supabase auto-pauses on zero DB activity. Keep-alive cron (Vercel or GitHub
  Actions) or a paid plan are the fixes. 90-day restore window if it pauses; no backups on free.

## Billing automation (already deployed)
- Edge Function `generate-monthly-bills` runs via pg_cron on the 1st of each month at
  6 AM IST (00:30 UTC).
- Creates payment records for all active tenants, sends push via ntfy.sh.

## Current state / open items
- App is live on Vercel and wired to real Supabase data (NOT seed data — confirmed
  2026-06-19: 4 landlords, 6 units, 6 tenants, 198 payment_records, all live).
- Free-tier project was auto-paused (May 30 -> June 19), restored June 19. Keep-alive now
  via Vercel Cron (`api/keep-alive.js` + `crons` in `vercel.json`) hitting Supabase daily.
- The local working copy was wiped June 19 and recovered from GitHub
  (`github.com/cyrilabhilash43/myrepo`). `.env.local` and this file are gitignored/untracked
  so they live only locally + (env vars) in Vercel.
- Add an **Upload Agreement** button in TenantDetail so tenants can view landlord-uploaded
  agreements (missing feature).
- Confirm the `units.slice(0,3)` -> `units.map` fix in `LandlordApp.jsx` is actually deployed.

## Security posture (full lockdown completed 2026-06-22)
The app now uses a proper auth + access-control model. Architecture:
- **Landlords** authenticate via `/api/landlord-login` (verifies PIN through the
  `verify_landlord_pin` SECURITY DEFINER RPC, then mints a real Supabase session via
  magiclink token + client `verifyOtp`). PIN UX unchanged. Landlord app runs as the
  `authenticated` role with full table + storage access.
- **Tenants** use token-scoped SECURITY DEFINER RPCs only: `get_tenant_portal`,
  `tenant_mark_paid`, `tenant_submit_notice`, `tenant_cancel_notice`, `tenant_report_issue`,
  `tenant_save_push`, `tenant_mark_docs_submitted`. No direct table access.
- **Public apply page** uses minimal RPCs: `get_vacant_units`, `submit_application`,
  `submit_waitlist`, `application_status`, `application_mark_doc`.
- **Tables:** `anon` has NO access to any table (revoked) except column-level
  `landlord_users(id,name,role)` for the login screen. `authenticated` has full access.
- **Storage (`documents` bucket):** anon cannot read/list/sign sensitive docs (ID cards,
  agreements, applicant docs); issue photos (`issues/*`) stay anon-readable; uploads (insert)
  still work for tenants/applicants; authenticated landlords have full access. Tenants view
  their docs via `/api/doc-url` (service role, token-scoped). Plus data-minimization (delete
  ID docs after verify; applicant docs auto-deleted on approve/reject).
- **Server keys:** `SUPABASE_SERVICE_ROLE` in Vercel powers `/api/landlord-login`,
  `/api/doc-url`, `/api/notify`. Never in the client bundle.
- **Gotcha:** any NEW table must be granted to `authenticated` and (if tenant/public needs it)
  exposed via a SECURITY DEFINER RPC - never granted to `anon` directly. `maintenance_requests`
  was initially missed in the table lockdown; don't repeat that.

## How to work with Cyril
- Casual but focused. Tight responses, no fluff.
- Diagnose the issue before proposing a solution.
- Prefer targeted edits (str_replace-style patches) over full file rewrites.
- When a feature is entirely missing (not broken), flag it and propose the fix before building.
- After each step, state the logical next step.
- No em dashes, ever. Use commas, colons, or a new sentence.
