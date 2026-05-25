import { useState, useEffect } from "react"
import { supabase } from "./supabase"
import LandlordApp from "./LandlordApp"
import TenantPortal from "./TenantPortal"
import ApplicationPortal from "./ApplicationPortal"

const C = {
  bg: "#f5f5f7", surface: "#ffffff", border: "#e8e8f0",
  accent: "#5046e5", accentSoft: "#ede9fe", accentBorder: "#c4b5fd",
  text: "#1a1a2e", muted: "#9090a8", red: "#dc2626", redSoft: "#fee2e2",
}

function LoginScreen({ onLogin }) {
  const [users, setUsers] = useState([
    { id: 1, name: "Kavitha" }, { id: 2, name: "Arogya Swamy" },
    { id: 3, name: "Antonita" }, { id: 4, name: "Cyril" },
  ])
  const [selectedUser, setSelectedUser] = useState(null)
  const [pin, setPin] = useState("")
  const [error, setError] = useState("")
  const [checking, setChecking] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  useEffect(() => {
    supabase.from("landlord_users").select("id, name").order("id").then(({ data }) => {
      if (data && data.length > 0) setUsers(data)
    })
  }, [])

  const handlePinInput = (digit) => {
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      setError("")
      if (newPin.length === 4) verifyPin(newPin)
    }
  }

  const verifyPin = async (enteredPin) => {
    setChecking(true)
    const { data, error } = await supabase.rpc("verify_landlord_pin", { p_name: selectedUser.name, p_pin: enteredPin })
    if (data && !error) {
      localStorage.setItem("landlord_user", JSON.stringify({ id: data.id, name: data.name }))
      onLogin({ id: data.id, name: data.name })
    } else {
      setError("Incorrect PIN. Try again.")
      setPin("")
    }
    setChecking(false)
  }

  const inputStyle = { padding: "18px", background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 14, cursor: "pointer", fontWeight: 500, color: C.text, fontSize: 20, fontFamily: "inherit" }

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: C.accent }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div style={{ fontWeight: 700, fontSize: 24, color: C.text, letterSpacing: "-0.5px" }}>Property Manager</div>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Landlord access</div>
        </div>

        {!selectedUser ? (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textAlign: "center", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Who are you?</div>
            {users.map(u => (
              <button key={u.id} onClick={() => { setSelectedUser(u); setPin(""); setError("") }}
                style={{ width: "100%", padding: "15px 18px", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 16, cursor: "pointer", fontWeight: 500, color: C.text, fontSize: 16, fontFamily: "inherit", marginBottom: 10, textAlign: "left", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 600, color: C.accent, flexShrink: 0 }}>
                  {u.name.charAt(0)}
                </div>
                <span style={{ flex: 1 }}>{u.name}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            ))}
          </div>
        ) : showForgot ? (
          <div style={{ background: C.surface, borderRadius: 24, border: `0.5px solid ${C.border}`, padding: 28, textAlign: "center" }}>
            <div style={{ fontWeight: 600, fontSize: 18, color: C.text, marginBottom: 8 }}>Forgot PIN?</div>
            <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, marginBottom: 24 }}>Contact Cyril to reset your PIN.</div>
            <button onClick={() => { setShowForgot(false); setPin(""); setError("") }}
              style={{ width: "100%", padding: "14px", background: C.accent, border: "none", borderRadius: 14, cursor: "pointer", fontWeight: 600, color: "#fff", fontSize: 15, fontFamily: "inherit" }}>
              Back to login
            </button>
          </div>
        ) : (
          <div style={{ background: C.surface, borderRadius: 24, border: `0.5px solid ${C.border}`, padding: 28 }}>
            <button onClick={() => { setSelectedUser(null); setPin(""); setError("") }}
              style={{ background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, marginBottom: 20, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Back
            </button>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: C.accent, margin: "0 auto 12px" }}>
                {selectedUser.name.charAt(0)}
              </div>
              <div style={{ fontWeight: 600, fontSize: 18, color: C.text }}>Hi, {selectedUser.name.split(" ")[0]}</div>
              <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Enter your 4-digit PIN</div>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 20 }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: i < pin.length ? C.accent : C.border, transition: "background 0.15s" }} />
              ))}
            </div>
            {error && (
              <div style={{ background: C.redSoft, border: `0.5px solid #fca5a5`, borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: C.red, textAlign: "center" }}>
                {error}
              </div>
            )}
            {checking ? (
              <div style={{ textAlign: "center", padding: "16px 0", fontSize: 14, color: C.muted }}>Checking...</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
                {[1,2,3,4,5,6,7,8,9].map(d => (
                  <button key={d} onClick={() => handlePinInput(String(d))} style={inputStyle}>{d}</button>
                ))}
                <button onClick={() => { setPin(""); setError("") }} style={{ ...inputStyle, fontSize: 13, color: C.muted }}>Clear</button>
                <button onClick={() => handlePinInput("0")} style={inputStyle}>0</button>
                <button onClick={() => setPin(p => p.slice(0, -1))} style={{ ...inputStyle, fontSize: 18, color: C.muted }}>⌫</button>
              </div>
            )}
            <button onClick={() => setShowForgot(true)}
              style={{ width: "100%", background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "center", padding: "6px 0" }}>
              Forgot PIN?
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState(null)
  const [tenantToken, setTenantToken] = useState(null)
  const [applyUnitName, setApplyUnitName] = useState(null)
  const [landlordUser, setLandlordUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const path = window.location.pathname
    if (path.startsWith("/tenant/")) {
      setTenantToken(path.replace("/tenant/", ""))
      setView("tenant")
    } else if (path.startsWith("/apply/")) {
      setApplyUnitName(path.replace("/apply/", ""))
      setView("apply")
    } else {
      setView("landlord")
      const stored = localStorage.getItem("landlord_user")
      if (stored) { try { setLandlordUser(JSON.parse(stored)) } catch { localStorage.removeItem("landlord_user") } }
    }
    setAuthChecked(true)
  }, [])

  if (!authChecked) return null
  if (view === "tenant") return <TenantPortal token={tenantToken} />
  if (view === "apply") return <ApplicationPortal unitName={applyUnitName} />
  if (view === "landlord" && !landlordUser) return <LoginScreen onLogin={setLandlordUser} />
  if (view === "landlord" && landlordUser) return <LandlordApp user={landlordUser} onLogout={() => { localStorage.removeItem("landlord_user"); setLandlordUser(null) }} />
  return null
}
