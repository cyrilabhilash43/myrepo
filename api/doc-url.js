// Returns signed URLs for a tenant's documents, scoped by portal token.
// Used by the tenant portal after storage is locked to the public key.
import { createClient } from "@supabase/supabase-js"

const URL = process.env.VITE_SUPABASE_URL || "https://xasbqstbdhcjpujwkkhe.supabase.co"
const SERVICE = process.env.SUPABASE_SERVICE_ROLE

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false })
  if (!SERVICE) return res.status(500).json({ ok: false, error: "not configured" })
  const { token } = req.body || {}
  if (!token) return res.status(400).json({ ok: false, error: "token required" })

  const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })
  const { data: t, error } = await admin.from("tenants").select("id").eq("portal_token", token).maybeSingle()
  if (error || !t) return res.status(404).json({ ok: false })

  const out = { ok: true, docs: [], agreement: null }
  const { data: idFiles } = await admin.storage.from("documents").list(`${t.id}`, { limit: 50 })
  for (const f of idFiles || []) {
    const { data: u } = await admin.storage.from("documents").createSignedUrl(`${t.id}/${f.name}`, 3600)
    if (u?.signedUrl) out.docs.push({ name: f.name, url: u.signedUrl })
  }
  const { data: agFiles } = await admin.storage.from("documents").list(`agreements/${t.id}`, { limit: 10 })
  if (agFiles && agFiles.length) {
    const latest = agFiles[agFiles.length - 1]
    const { data: u } = await admin.storage.from("documents").createSignedUrl(`agreements/${t.id}/${latest.name}`, 3600)
    if (u?.signedUrl) out.agreement = { name: latest.name, url: u.signedUrl }
  }
  return res.status(200).json(out)
}
