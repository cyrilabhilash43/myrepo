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

## Security posture (reviewed 2026-06-21)
- **Closed:** landlord PIN hash no longer readable by the public key (`verify_landlord_pin`
  is SECURITY DEFINER; column-level grant on `landlord_users`). DELETE revoked from `anon`
  on all core tables. ntfy topic moved server-side (`/api/notify-landlord`).
- **Mitigated:** Aadhaar/PAN documents - data minimization (landlord can delete ID docs
  after verifying; applicant docs auto-deleted on approve/reject). Bucket itself is still
  open to the publishable key.
- **KNOWN, DEFERRED (needs auth rebuild):** the publishable key still grants read + write/update
  to all tables (tenant tokens, PII readable; data can be tampered/inserted). Root cause: the
  landlord app + public pages share the anon key, so RLS can't distinguish them without real
  landlord authentication. Full fix = Supabase Auth for landlords + token-scoped RPCs for
  tenants + lock all tables. `SUPABASE_SERVICE_ROLE` is already set in Vercel for when this is done.

## How to work with Cyril
- Casual but focused. Tight responses, no fluff.
- Diagnose the issue before proposing a solution.
- Prefer targeted edits (str_replace-style patches) over full file rewrites.
- When a feature is entirely missing (not broken), flag it and propose the fix before building.
- After each step, state the logical next step.
- No em dashes, ever. Use commas, colons, or a new sentence.
