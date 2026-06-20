import { supabase } from "./supabase"

// Public VAPID key (safe to ship in the client). Env override supported.
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC || "BJRO7kZ9VaLv3I11GroOmYJ_Xv9aLnCx5ZIbZ5GmfjrhoxPAjLFOE0mVba9Wdpa3o4DVPCiHcHgdgphSTuqGJ5s"

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true

// Returns: "unsupported" | "needs-install" | "denied" | "subscribed" | "available"
export async function getPushState() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    // iOS only exposes Push API inside an installed PWA
    if (isIOS() && !isStandalone()) return "needs-install"
    return "unsupported"
  }
  if (isIOS() && !isStandalone()) return "needs-install"
  if (Notification.permission === "denied") return "denied"
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const existing = reg && (await reg.pushManager.getSubscription())
    if (existing) return "subscribed"
  } catch { /* ignore */ }
  return "available"
}

export async function enablePush(tenantId) {
  const reg = await navigator.serviceWorker.register("/sw.js")
  await navigator.serviceWorker.ready
  const permission = await Notification.requestPermission()
  if (permission !== "granted") return { ok: false, reason: permission }

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    })
  }
  const json = sub.toJSON()
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert({ tenant_id: tenantId, endpoint: json.endpoint, subscription: json }, { onConflict: "endpoint" })
  if (error) return { ok: false, reason: error.message }
  return { ok: true }
}
