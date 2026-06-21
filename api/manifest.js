// Per-tenant PWA manifest so an installed tenant app opens to that tenant's
// portal (start_url) instead of the landlord login at "/".
export default function handler(req, res) {
  const token = (req.query.token || "").toString().replace(/[^a-zA-Z0-9-]/g, "")
  const startUrl = token ? `/tenant/${token}` : "/"
  const manifest = {
    name: "Property Manager",
    short_name: "PropMgr",
    description: "Pay rent, view bills, upload documents, and report issues",
    start_url: startUrl,
    scope: "/",
    display: "standalone",
    background_color: "#f5f6fa",
    theme_color: "#5046e5",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  }
  res.setHeader("Content-Type", "application/manifest+json")
  res.setHeader("Cache-Control", "no-store")
  res.status(200).send(JSON.stringify(manifest))
}
