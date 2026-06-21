// Sends a Web Push notification to all of a tenant's subscribed devices.
// POST { tenant_id, title, body, url }
// VAPID private key lives only here (Vercel env), never in the client bundle.
import webpush from "web-push"

const SUPA_URL = process.env.VITE_SUPABASE_URL || "https://xasbqstbdhcjpujwkkhe.supabase.co"
// Use the service role server-side so it keeps working after anon is locked out of tables.
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_qE_UhjfdIGAn7dQu_u1HBw_M-W4jF-j"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" })

  const pub = process.env.VAPID_PUBLIC
  const priv = process.env.VAPID_PRIVATE
  if (!pub || !priv) return res.status(500).json({ ok: false, error: "VAPID keys not configured" })
  webpush.setVapidDetails("mailto:cyrilabhilash43@gmail.com", pub, priv)

  const { tenant_id, title, body, url } = req.body || {}
  if (!tenant_id) return res.status(400).json({ ok: false, error: "tenant_id required" })

  // Fetch this tenant's push subscriptions
  const r = await fetch(`${SUPA_URL}/rest/v1/push_subscriptions?tenant_id=eq.${tenant_id}&select=endpoint,subscription`, {
    headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
  })
  if (!r.ok) return res.status(502).json({ ok: false, error: "Could not read subscriptions" })
  const subs = await r.json()
  if (!subs.length) return res.status(200).json({ ok: true, sent: 0, note: "no subscriptions" })

  const payload = JSON.stringify({ title: title || "Property Manager", body: body || "", url: url || "/" })
  let sent = 0, removed = 0
  await Promise.all(subs.map(async (row) => {
    try {
      await webpush.sendNotification(row.subscription, payload)
      sent++
    } catch (err) {
      // 404/410 = subscription expired; clean it up
      if (err.statusCode === 404 || err.statusCode === 410) {
        await fetch(`${SUPA_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(row.endpoint)}`, {
          method: "DELETE",
          headers: { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` },
        }).catch(() => {})
        removed++
      }
    }
  }))

  return res.status(200).json({ ok: true, sent, removed })
}
