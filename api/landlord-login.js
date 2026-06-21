// Landlord login: verify the PIN (existing SECURITY DEFINER RPC), then issue a
// real Supabase session via a magiclink token the client redeems with verifyOtp.
// Keeps the PIN UX while giving landlords an authenticated identity.
import { createClient } from "@supabase/supabase-js"

const URL = process.env.VITE_SUPABASE_URL || "https://xasbqstbdhcjpujwkkhe.supabase.co"
const ANON = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_qE_UhjfdIGAn7dQu_u1HBw_M-W4jF-j"
const SERVICE = process.env.SUPABASE_SERVICE_ROLE

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false })
  const { name, pin } = req.body || {}
  if (!name || !pin) return res.status(400).json({ ok: false, error: "name and pin required" })
  if (!SERVICE) return res.status(500).json({ ok: false, error: "server not configured" })

  try {
    // 1. Verify the PIN with the existing definer RPC (no hash ever leaves the DB)
    const pub = createClient(URL, ANON, { auth: { persistSession: false } })
    const { data: who, error: pinErr } = await pub.rpc("verify_landlord_pin", { p_name: name, p_pin: pin })
    if (pinErr) { console.error("PIN_RPC_ERR", pinErr.message); return res.status(500).json({ ok: false, step: "pin", error: pinErr.message }) }
    const landlord = Array.isArray(who) ? who[0] : who
    if (!landlord || !landlord.id) return res.status(401).json({ ok: false, error: "Incorrect PIN" })

    // 2. Ensure an auth user exists for this landlord
    const admin = createClient(URL, SERVICE, { auth: { persistSession: false } })
    const email = `landlord-${landlord.id}@hma.local`
    const cu = await admin.auth.admin.createUser({
      email, email_confirm: true,
      user_metadata: { name: landlord.name, role: "landlord", landlord_id: landlord.id },
    })
    if (cu.error && !/registered|exists/i.test(cu.error.message)) { console.error("CREATE_USER_ERR", cu.error.message); return res.status(500).json({ ok: false, step: "createUser", error: cu.error.message }) }

    // 3. Mint a one-time token the client redeems for a session
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({ type: "magiclink", email })
    const token_hash = link?.properties?.hashed_token
    if (linkErr || !token_hash) { console.error("GENLINK_ERR", linkErr?.message); return res.status(500).json({ ok: false, step: "generateLink", error: linkErr?.message || "no token" }) }

    return res.status(200).json({ ok: true, token_hash, email, landlord: { id: landlord.id, name: landlord.name } })
  } catch (e) {
    console.error("LOGIN_FATAL", e?.message)
    return res.status(500).json({ ok: false, step: "fatal", error: String(e?.message || e) })
  }
}
