import { useState, useEffect } from "react"

// Lightweight global toast. Call toast("Saved") from anywhere; render <ToastHost/> once.
let listeners = []
let counter = 0

export function toast(message, type = "success") {
  const t = { id: ++counter, message, type }
  listeners.forEach((l) => l(t))
}

const TONE = {
  success: { accent: "#059669", icon: "M20 6L9 17l-5-5" },
  error: { accent: "#dc2626", icon: "M18 6L6 18M6 6l12 12" },
  info: { accent: "#5046e5", icon: "M12 16v-4M12 8h.01" },
}

export function ToastHost() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const add = (t) => {
      setToasts((ts) => [...ts, t])
      setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== t.id)), 3400)
    }
    listeners.push(add)
    return () => { listeners = listeners.filter((l) => l !== add) }
  }, [])

  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: "calc(env(safe-area-inset-bottom, 0px) + 84px)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, pointerEvents: "none", padding: "0 16px" }}>
      <style>{`@keyframes pm-toast-in{from{opacity:0;transform:translateY(12px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)}}`}</style>
      {toasts.map((t) => {
        const tone = TONE[t.type] || TONE.success
        return (
          <div key={t.id}
            style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 10, background: "#1a1a2e", color: "#fff", borderRadius: 14, padding: "12px 16px", fontSize: 14, fontWeight: 600, fontFamily: "inherit", boxShadow: "0 8px 30px rgba(0,0,0,0.22)", maxWidth: 440, width: "fit-content", animation: "pm-toast-in 0.22s cubic-bezier(0.2,0.9,0.3,1)" }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: tone.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d={tone.icon} /></svg>
            </span>
            <span>{t.message}</span>
          </div>
        )
      })}
    </div>
  )
}
