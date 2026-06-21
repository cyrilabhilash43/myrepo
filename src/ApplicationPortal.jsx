import { useState, useEffect } from "react"
import { supabase } from "./supabase"

const C = {
  bg: "#f0efe9", surface: "#ffffff", border: "#e4e3dc",
  accent: "#3820c0", accentSoft: "#ece8fc", accentBorder: "#a8a0e0",
  text: "#141410", sub: "#3c3c36", muted: "#888880",
  green: "#166a3e", greenSoft: "#e6f4ec", greenBorder: "#a8d8bc",
  red: "#b81410", redSoft: "#fce9e8",
  amber: "#96520a", amberSoft: "#fdf2e0",
}

const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN")

const inputStyle = {
  width: "100%", padding: "12px 14px", background: C.bg,
  border: `0.5px solid ${C.border}`, borderRadius: 12,
  fontSize: 15, color: C.text, outline: "none",
  fontFamily: "inherit", boxSizing: "border-box",
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  )
}

function Chips({ options, value, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map(o => (
        <button key={o} type="button" onClick={() => onChange(o)}
          style={{ padding: "9px 14px", background: value === o ? C.accent : C.surface, border: `0.5px solid ${value === o ? C.accent : C.border}`, borderRadius: 20, cursor: "pointer", fontWeight: 600, color: value === o ? "#fff" : C.sub, fontSize: 13, fontFamily: "inherit" }}>
          {o}
        </button>
      ))}
    </div>
  )
}

function notifyLandlord(text) {
  fetch("/api/notify-landlord", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }).catch(() => {})
}

function Header() {
  return (
    <div style={{ background: C.surface, borderBottom: `0.5px solid ${C.border}`, padding: "16px 20px 14px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>Property Manager</div>
          <div style={{ fontSize: 12, color: C.muted }}>Rental application</div>
        </div>
      </div>
    </div>
  )
}

export default function ApplicationPortal({ unitName }) {
  const [vacantUnits, setVacantUnits] = useState([])
  const [unit, setUnit] = useState(null)            // selected unit (null = list/waitlist)
  const [mode, setMode] = useState("list")          // list | form | waitlist
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [waitlisted, setWaitlisted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [applicationId, setApplicationId] = useState(null)
  const [docsRequested, setDocsRequested] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState({})
  const [uploadedDocs, setUploadedDocs] = useState({})

  const [form, setForm] = useState({
    name: "", phone: "", occupation: "", monthly_income: "", people_count: "",
    preferred_move_in: "", message: "", household_type: "", vehicles: "", current_address: "",
  })

  useEffect(() => {
    supabase.from("units").select("*").eq("status", "Vacant").order("id").then(({ data }) => {
      const vac = data || []
      setVacantUnits(vac)
      if (unitName) {
        const u = vac.find(x => x.name.toLowerCase() === unitName.toLowerCase())
        if (u) { setUnit(u); setMode("form") }
        else setMode(vac.length ? "list" : "waitlist")
      } else {
        setMode(vac.length ? "list" : "waitlist")
      }
      setLoading(false)
    })
  }, [unitName])

  useEffect(() => {
    if (!applicationId) return
    const check = async () => {
      const { data } = await supabase.from("applications").select("docs_requested").eq("id", applicationId).maybeSingle()
      if (data?.docs_requested) { setDocsRequested(true); return true }
      return false
    }
    check()
    const interval = setInterval(async () => { if (await check()) clearInterval(interval) }, 10000)
    return () => clearInterval(interval)
  }, [applicationId])

  const submitApplication = async () => {
    if (!form.name.trim() || !form.phone.trim()) { alert("Please fill in your name and WhatsApp number."); return }
    setSubmitting(true)
    const { data, error } = await supabase.from("applications").insert([{
      unit_id: unit.id, unit_name: unit.name,
      name: form.name.trim(), phone: form.phone.trim(),
      occupation: form.occupation, monthly_income: form.monthly_income,
      people_count: form.people_count, preferred_move_in: form.preferred_move_in,
      message: form.message, household_type: form.household_type,
      vehicles: form.vehicles, current_address: form.current_address, status: "Pending",
    }]).select().single()
    if (data) { setApplicationId(data.id); setSubmitted(true); notifyLandlord(`${form.name} applied for Unit ${unit.name}`) }
    else alert("Something went wrong. Please try again.")
    setSubmitting(false)
  }

  const submitWaitlist = async () => {
    if (!form.name.trim() || !form.phone.trim()) { alert("Please fill in your name and WhatsApp number."); return }
    setSubmitting(true)
    const { data } = await supabase.from("waitlist").insert([{
      name: form.name.trim(), phone: form.phone.trim(),
      household_type: form.household_type, vehicles: form.vehicles,
      current_address: form.current_address, message: form.message,
    }]).select().single()
    if (data) { setWaitlisted(true); notifyLandlord(`${form.name} joined the waitlist`) }
    else alert("Something went wrong. Please try again.")
    setSubmitting(false)
  }

  const handleDocUpload = async (e, docType) => {
    const file = e.target.files[0]
    if (!file || !applicationId) return
    setUploadingDoc(p => ({ ...p, [docType]: true }))
    const path = `applications/${applicationId}/${docType}_${Date.now()}_${file.name}`
    const { data } = await supabase.storage.from("documents").upload(path, file, { upsert: true })
    if (data) {
      const { data: u } = await supabase.storage.from("documents").createSignedUrl(data.path, 3600)
      setUploadedDocs(p => ({ ...p, [docType]: { name: file.name, url: u?.signedUrl } }))
      await supabase.from("applications").update({ [`${docType}_uploaded`]: true }).eq("id", applicationId)
    }
    setUploadingDoc(p => ({ ...p, [docType]: false }))
  }

  const wrap = { minHeight: "100vh", background: C.bg, fontFamily: "'Bricolage Grotesque', sans-serif", paddingBottom: 40 }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Bricolage Grotesque', sans-serif" }}>
      <div style={{ color: C.muted, fontSize: 14 }}>Loading...</div>
    </div>
  )

  // ── Waitlisted confirmation ──
  if (waitlisted) return (
    <div style={wrap}><Header />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ background: C.surface, borderRadius: 16, border: `0.5px solid ${C.border}`, padding: 32, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: C.greenSoft, border: `0.5px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: C.green }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          </div>
          <div style={{ fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 8 }}>You're on the list!</div>
          <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>Thanks, {form.name.split(" ")[0]}. We'll message you on WhatsApp as soon as a flat opens up.</div>
        </div>
      </div>
    </div>
  )

  // ── Submitted application ──
  if (submitted) return (
    <div style={wrap}><Header />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ background: C.surface, borderRadius: 16, border: `0.5px solid ${C.border}`, padding: 32, textAlign: "center", marginBottom: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: C.greenSoft, border: `0.5px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: C.green }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          </div>
          <div style={{ fontWeight: 700, fontSize: 20, color: C.text, letterSpacing: "-0.3px", marginBottom: 8 }}>Application submitted!</div>
          <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>Thank you, {form.name.split(" ")[0]}. The landlord will review your application and contact you on WhatsApp.</div>
        </div>

        <div style={{ background: C.surface, borderRadius: 16, border: `0.5px solid ${C.border}`, padding: 18, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Your application</div>
          {[["Unit", `${unit.name} · ${unit.floor}`], ["Name", form.name], ["WhatsApp", `+${form.phone}`], ["Monthly rent", fmt(unit.rent)]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `0.5px solid ${C.border}` }}>
              <span style={{ fontSize: 13, color: C.muted }}>{l}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
            <span style={{ fontSize: 13, color: C.muted }}>Status</span>
            <span style={{ fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: C.amberSoft, color: C.amber, border: `0.5px solid ${C.amber}40` }}>Under review</span>
          </div>
        </div>

        {docsRequested && (
          <div style={{ background: C.surface, borderRadius: 16, border: `1.5px solid ${C.accent}`, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>Documents requested</div>
                <div style={{ fontSize: 13, color: C.muted, marginTop: 3, lineHeight: 1.6 }}>The landlord is interested in your application. Please upload your Aadhaar and PAN card to proceed.</div>
              </div>
            </div>
            {[
              { key: "aadhaar", label: "Aadhaar Card", desc: "Front and back, clear photo or PDF" },
              { key: "pan", label: "PAN Card", desc: "Clear photo or scanned copy" },
            ].map(doc => (
              <div key={doc.key} style={{ background: uploadedDocs[doc.key] ? C.greenSoft : C.bg, borderRadius: 14, border: `0.5px solid ${uploadedDocs[doc.key] ? C.greenBorder : C.border}`, padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: uploadedDocs[doc.key] ? C.green : C.text }}>{doc.label}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{uploadedDocs[doc.key] ? uploadedDocs[doc.key].name : doc.desc}</div>
                  </div>
                  {uploadedDocs[doc.key] ? (
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <a href={uploadedDocs[doc.key].url} target="_blank" rel="noreferrer" style={{ padding: "7px 12px", background: C.greenSoft, border: `0.5px solid ${C.greenBorder}`, borderRadius: 10, fontSize: 12, color: C.green, fontWeight: 600, textDecoration: "none" }}>View</a>
                      <span style={{ fontSize: 18, color: C.green }}>✓</span>
                    </div>
                  ) : uploadingDoc[doc.key] ? (
                    <div style={{ fontSize: 12, color: C.accent, fontWeight: 500 }}>Uploading...</div>
                  ) : (
                    <label style={{ padding: "8px 14px", background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, borderRadius: 10, fontSize: 13, color: C.accent, fontWeight: 600, cursor: "pointer" }}>
                      Upload
                      <input type="file" accept="image/*,.pdf" onChange={e => handleDocUpload(e, doc.key)} style={{ display: "none" }} />
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ background: C.accentSoft, borderRadius: 14, border: `0.5px solid ${C.accentBorder}`, padding: "14px 16px" }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: C.accent, marginBottom: 4 }}>What happens next?</div>
          <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.7 }}>
            {docsRequested ? "Upload your documents above. The landlord will review and get back to you shortly." : "The landlord will review your application. If interested, they may ask for documents. You will be notified via WhatsApp."}
          </div>
        </div>
      </div>
    </div>
  )

  // ── Waitlist form (nothing available) ──
  if (mode === "waitlist") return (
    <div style={wrap}><Header />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ background: C.surface, borderRadius: 16, border: `0.5px solid ${C.border}`, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: "-0.4px" }}>All flats are occupied right now</div>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 6, lineHeight: 1.6 }}>Leave your details and we'll message you the moment a flat opens up.</div>
        </div>
        <div style={{ background: C.surface, borderRadius: 16, border: `0.5px solid ${C.border}`, padding: 20, marginBottom: 16 }}>
          <Field label="Full name *"><input style={inputStyle} placeholder="Your full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="WhatsApp number *"><input style={inputStyle} placeholder="91XXXXXXXXXX" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Field>
          <Field label="Family or bachelors"><Chips options={["Family", "Bachelors"]} value={form.household_type} onChange={v => setForm(f => ({ ...f, household_type: v }))} /></Field>
          <Field label="Vehicles (parking)"><Chips options={["None", "Bike", "Car", "Both"]} value={form.vehicles} onChange={v => setForm(f => ({ ...f, vehicles: v }))} /></Field>
          <Field label="Current address / city"><input style={inputStyle} placeholder="Where are you now?" value={form.current_address} onChange={e => setForm(f => ({ ...f, current_address: e.target.value }))} /></Field>
          <Field label="What are you looking for?"><textarea style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} rows={3} placeholder="Budget, when you need it, anything else..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} /></Field>
        </div>
        <button onClick={submitWaitlist} disabled={submitting}
          style={{ width: "100%", padding: "16px", background: submitting ? C.bg : C.accent, border: "none", borderRadius: 14, cursor: submitting ? "default" : "pointer", fontWeight: 700, color: submitting ? C.muted : "#fff", fontSize: 16, fontFamily: "inherit" }}>
          {submitting ? "Submitting..." : "Join the waitlist"}
        </button>
      </div>
    </div>
  )

  // ── Unit list (landing) ──
  if (mode === "list") return (
    <div style={wrap}><Header />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: C.text, letterSpacing: "-0.5px" }}>Available flats</div>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>Tap a flat to apply. It takes 2 minutes.</div>
        </div>
        {vacantUnits.map(u => (
          <button key={u.id} onClick={() => { setUnit(u); setMode("form") }}
            style={{ width: "100%", textAlign: "left", background: C.surface, borderRadius: 16, border: `0.5px solid ${C.border}`, padding: 18, marginBottom: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.greenSoft, border: `0.5px solid ${C.greenBorder}`, borderRadius: 8, padding: "3px 8px", fontSize: 10, fontWeight: 600, color: C.green, marginBottom: 8 }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg> Available
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Unit {u.name}</div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{u.floor} · {u.type}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.accent, marginTop: 8 }}>{fmt(u.rent)}<span style={{ fontSize: 12, color: C.muted, fontWeight: 400 }}>/mo · {fmt(u.advance)} advance</span></div>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        ))}
        <button onClick={() => setMode("waitlist")}
          style={{ width: "100%", padding: "14px", background: "none", border: `0.5px dashed ${C.accentBorder}`, borderRadius: 14, cursor: "pointer", fontWeight: 600, color: C.accent, fontSize: 14, fontFamily: "inherit", marginTop: 4 }}>
          None of these fit? Notify me when something opens
        </button>
      </div>
    </div>
  )

  // ── Application form (unit selected) ──
  return (
    <div style={wrap}><Header />
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px" }}>
        {vacantUnits.length > 1 && (
          <button onClick={() => { setUnit(null); setMode("list") }}
            style={{ background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: 500, marginBottom: 14, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg> All flats
          </button>
        )}
        <div style={{ background: C.surface, borderRadius: 16, border: `0.5px solid ${C.border}`, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.greenSoft, border: `0.5px solid ${C.greenBorder}`, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 600, color: C.green, marginBottom: 12 }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg> Available now
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.5px" }}>Unit {unit.name}</div>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 4 }}>{unit.floor} · {unit.type}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
            {[["Monthly rent", fmt(unit.rent)], ["Advance required", fmt(unit.advance)]].map(([l, v]) => (
              <div key={l} style={{ background: C.bg, borderRadius: 12, padding: "12px 14px", border: `0.5px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{l}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: C.surface, borderRadius: 16, border: `0.5px solid ${C.border}`, padding: 20, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 18 }}>Your details</div>
          <Field label="Full name *"><input style={inputStyle} placeholder="Your full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="WhatsApp number *"><input style={inputStyle} placeholder="91XXXXXXXXXX" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Occupation"><input style={inputStyle} placeholder="e.g. Engineer" value={form.occupation} onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))} /></Field>
            <Field label="Monthly income"><input style={inputStyle} placeholder="₹XX,000" value={form.monthly_income} onChange={e => setForm(f => ({ ...f, monthly_income: e.target.value }))} /></Field>
          </div>
          <Field label="Family or bachelors"><Chips options={["Family", "Bachelors"]} value={form.household_type} onChange={v => setForm(f => ({ ...f, household_type: v }))} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="People moving in"><input style={inputStyle} placeholder="e.g. 2" value={form.people_count} onChange={e => setForm(f => ({ ...f, people_count: e.target.value }))} /></Field>
            <Field label="Preferred move-in"><input style={{ ...inputStyle, fontSize: 13 }} type="date" value={form.preferred_move_in} onChange={e => setForm(f => ({ ...f, preferred_move_in: e.target.value }))} /></Field>
          </div>
          <Field label="Vehicles (parking)"><Chips options={["None", "Bike", "Car", "Both"]} value={form.vehicles} onChange={v => setForm(f => ({ ...f, vehicles: v }))} /></Field>
          <Field label="Current address / city"><input style={inputStyle} placeholder="Where are you now?" value={form.current_address} onChange={e => setForm(f => ({ ...f, current_address: e.target.value }))} /></Field>
          <Field label="Message to landlord"><textarea style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} rows={3} placeholder="Tell us a bit about yourself, your family, work..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} /></Field>
        </div>

        <button onClick={submitApplication} disabled={submitting}
          style={{ width: "100%", padding: "16px", background: submitting ? C.bg : C.accent, border: "none", borderRadius: 14, cursor: submitting ? "default" : "pointer", fontWeight: 700, color: submitting ? C.muted : "#fff", fontSize: 16, fontFamily: "inherit" }}>
          {submitting ? "Submitting..." : "Submit application"}
        </button>
        <div style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
          Your details are only shared with the property owner. You will be contacted via WhatsApp if approved.
        </div>
      </div>
    </div>
  )
}
