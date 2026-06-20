// Vercel Cron keep-alive.
// Free-tier Supabase auto-pauses after 7 days of zero activity. This runs
// daily (scheduled in vercel.json) and makes one tiny request to the DB so
// the project never goes idle. Reads the same env vars the frontend build
// uses; no secrets are committed here.

// These are public client-side values (already shipped in the browser bundle),
// so it is safe to keep them here as a fallback. Env vars take precedence if set.
const PUBLIC_URL = "https://xasbqstbdhcjpujwkkhe.supabase.co"
const PUBLIC_ANON_KEY = "sb_publishable_qE_UhjfdIGAn7dQu_u1HBw_M-W4jF-j"

export default async function handler(req, res) {
  const url = process.env.VITE_SUPABASE_URL || PUBLIC_URL
  const key = process.env.VITE_SUPABASE_ANON_KEY || PUBLIC_ANON_KEY

  try {
    const r = await fetch(`${url}/rest/v1/landlord_users?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    })
    const ok = r.ok
    return res.status(ok ? 200 : 502).json({
      ok,
      status: r.status,
      pinged: "landlord_users",
      at: new Date().toISOString(),
    })
  } catch (err) {
    return res.status(502).json({ ok: false, error: String(err) })
  }
}
