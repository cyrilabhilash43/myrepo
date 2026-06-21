// Server-side relay so the ntfy topic is never exposed in the browser bundle.
// Clients POST { text }; this forwards to the private landlord topic.
const NTFY_TOPIC = process.env.NTFY_TOPIC || "building-cyril-a59e9c4aeb"

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false })
  const text = (req.body && req.body.text) ? String(req.body.text).slice(0, 280) : ""
  if (!text) return res.status(400).json({ ok: false })
  await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
    method: "POST", body: text, headers: { Title: "Building update" },
  }).catch(() => {})
  return res.status(200).json({ ok: true })
}
