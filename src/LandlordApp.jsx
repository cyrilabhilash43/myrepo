import { useState, useEffect, createContext, useContext } from "react"
import { supabase } from "./supabase"
import { toast } from "./toast"

const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN")
const fmtDate = (d) => { if (!d) return ""; const x = new Date(d); return isNaN(x) ? d : x.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) }
const nowStr = () => new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const WATER_UNIT_IDS = [1,2,3,4]
const WATER_SHARES = 5
const ELEC_TENANT_IDS = [1,2]

function isOverdue(month, year) {
  return new Date() > new Date(year, month, 10)
}

// Fire-and-forget push notification to a tenant via the serverless sender.
function notifyTenant(tenant_id, title, body, url = "/") {
  if (!tenant_id) return
  fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tenant_id, title, body, url }),
  }).catch(() => {})
}

// Remove an applicant's uploaded ID docs once their application is resolved.
async function deleteApplicantDocs(appId) {
  const { data } = await supabase.storage.from("documents").list(`applications/${appId}`)
  if (data && data.length) {
    await supabase.storage.from("documents").remove(data.map(f => `applications/${appId}/${f.name}`))
  }
}

// Audit log: track which landlord did what. Actor is set on login.
let currentActor = null
function setActor(name) { currentActor = name }
function logAudit(action) {
  if (!currentActor) return
  supabase.from("audit_log").insert([{ actor_name: currentActor, action }]).then(() => {}, () => {})
}

const LangCtx = createContext(null)
const useLT = () => useContext(LangCtx) || LT.en

const C = {
  bg: "#f4f4f8", surface: "#ffffff", border: "#eaeaf2", borderHover: "#d0d0e0",
  accent: "#5046e5", accentSoft: "#ede9fe", accentBorder: "#c4b5fd",
  text: "#1a1a2e", sub: "#4a4a6a", muted: "#9090a8",
  green: "#059669", greenSoft: "#d1fae5", greenBorder: "#6ee7b7",
  red: "#dc2626", redSoft: "#fee2e2", redBorder: "#fca5a5",
  amber: "#d97706", amberSoft: "#fef3c7", amberBorder: "#fcd34d",
  blue: "#2563eb", blueSoft: "#dbeafe", blueBorder: "#93c5fd",
}

const LT = {
  en: {
    appName: "Property Manager", logout: "Logout",
    tabs: { home: "Home", units: "Units", bills: "Bills", broadcast: "Broadcast", analytics: "Analytics", issues: "Issues" },
    help: "How to use this app",
    helpContent: [
      { icon: "home", title: "Home", body: "Your daily dashboard. See alerts, verify tenant payments, and get a quick overview of all units." },
      { icon: "building-estate", title: "Units", body: "Tap any unit to view payment history, add bills, manage agreements, and handle notices. Vacant units show a Share button to accept applications." },
      { icon: "receipt", title: "Bills", body: "Enter the monthly water bill (auto-split ÷5) and electricity bills for Francis and Vital. Last month's amounts shown as hints." },
      { icon: "speakerphone", title: "Broadcast", body: "Send WhatsApp messages to all or selected tenants. Templates for rent reminders, agreement requests, portal links, and custom messages." },
      { icon: "chart-bar", title: "Analytics", body: "Revenue trends, collection rates, tenant health scores, and building occupancy overview." },
    ],
    routine: "Monthly routine",
    routineSteps: ["Enter water and electricity bills in Bills tab","Send rent reminders via Broadcast","Confirm payments when tenants mark as paid","Check Issues tab for maintenance requests"],
    mo: "/mo", perMonth: "per month",
    occupied: "occupied", vacant: "Vacant",
    overdue: "Overdue", pending: "Pending", paid: "Paid", verifying: "Verifying",
    noAgreement: "No agreement", docsRequested: "Docs requested", docsReceived: "Docs received",
    noticeGiven: "Notice given",
    monthlyRent: "Monthly rent", allUnits: "All units", paidUp: "Paid up",
    outstanding: "Outstanding", collected: "Collected", advanceHeld: "Advance held",
    collectionRate: "Collection rate",
    overdueAlert: (n) => `${n} tenant${n > 1 ? "s" : ""} with overdue payments`,
    overdueAlertSub: "Tap the unit to view details and send a reminder.",
    billsAlert: (m) => `${m} bills not entered yet`,
    billsAlertSub: "Tap Bills tab to add water and electricity bills.",
    verifyPayment: "Verify payment",
    verifyDesc: "Check your UPI notification then confirm or dispute.",
    confirm: "Confirm", dispute: "Dispute",
    units: "Units", since: "Since",
    overview: "Overview", payments: "Payments", notice: "Notice",
    phone: "WhatsApp number", noPhone: "Not set", addPhone: "+ Add number", editPhone: "Edit",
    agreement: "Agreement", requestDocs: "Request docs via WA", sendPortal: "Send portal link via WhatsApp",
    documents: "Documents uploaded", noDocs: "No documents uploaded yet.",
    markPaid: "Mark paid", markUnpaid: "Mark unpaid", addBills: "+ Bills", saveBills: "Save",
    addMonth: "+ Add this month",
    noNotice: "No active notice", noNoticeDesc: (name) => `Record a notice if ${name} is planning to move out.`,
    recordNotice: "Record notice to vacate", confirmNotice: "Confirm notice", cancelNotice: "Cancel notice",
    cancelNoticeSure: "Cancel notice to vacate?",
    settlement: "Settlement", advancePaidL: "Advance paid", outstandingDues: "Outstanding dues",
    deductions: "Deductions before settlement",
    deductionsDesc: "Enter amounts to deduct from advance. Leave blank if nothing applies.",
    painting: "Painting / whitewash", paintingHint: "If tenant lived < 2 years",
    damages: "Damages and repairs", damagesHint: "Broken fixtures, tiles, walls",
    cleaning: "Cleaning charges", cleaningHint: "If unit left in poor condition",
    otherDeduction: "Other deductions", otherHint: "Any other agreed amount",
    finalSettlement: "Final settlement",
    refundTo: (name) => `Refund to ${name}`,
    owes: (name) => `${name} owes`,
    settleAndVacate: "Confirm settlement and vacate unit",
    settledDone: "Settlement complete. Unit vacated.",
    cancelledNotice: "Notice cancelled. Tenant is still here.",
    waterBill: "Water bill", waterDesc: "Total bill · auto-split ÷5",
    electricityBills: "Electricity bills", electricityDesc: "Actual EB bill for Francis (G1) and Vital (S1) only",
    freeElec: "Free government electricity · 200 units",
    totalDueMonth: "Total due this month",
    saveBillsBtn: (m, y) => `Save ${m} ${y} bills`,
    saving: "Saving...", billsSaved: "Bills saved and tenant records updated!",
    broadcastDesc: "Select a template and choose recipients. Each message opens WhatsApp individually.",
    chooseTemplate: "Message type",
    recipients: "Recipients",
    selectAll: "Select all", clearAll: "Clear all",
    sendTo: (n) => `Send to ${n} tenant${n > 1 ? "s" : ""}`,
    chooseFirst: "Select a message type above first",
    noNumber: "No number",
    msgSent: (n) => `Sent to ${n} tenant${n > 1 ? "s" : ""}`,
    issues: "Issues", noIssues: "No issues reported",
    noIssuesSub: "Tenants report issues from their portal.",
    inProgress: "In progress", resolved: "Resolved",
    applications: "Applications", noApps: "No applications yet",
    noAppsSub: "Share the application link for a vacant unit to receive applications.",
    appPending: "Pending", appApproved: "Approved", appRejected: "Rejected",
    requestDocuments: "Request documents", approveApp: "Approve", rejectApp: "Reject",
    docsRequestedBadge: "Docs requested",
    approveAndOnboard: "Approve and create tenant",
    share: "Share", copyLink: "Copy link",
    addTenant: "+ Add tenant",
    analyticsTitle: "Analytics", year2026: "2026 overview",
    revenue: "Revenue", tenantHealth: "Tenant health",
    buildingOverview: "Building overview", issuesSummary: "Issues summary",
  },
  kn: {
    appName: "ಪ್ರಾಪರ್ಟಿ ಮ್ಯಾನೇಜರ್", logout: "ಲಾಗ್ ಔಟ್",
    tabs: { home: "ಮುಖಪುಟ", units: "ಯೂನಿಟ್", bills: "ಬಿಲ್ಲು", broadcast: "ಸಂದೇಶ", analytics: "ವಿಶ್ಲೇಷಣೆ", issues: "ಸಮಸ್ಯೆ" },
    help: "ಆ್ಯಪ್ ಹೇಗೆ ಬಳಸಬೇಕು",
    helpContent: [
      { icon: "home", title: "ಮುಖಪುಟ", body: "ನಿಮ್ಮ ದಿನನಿತ್ಯದ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್." },
      { icon: "building-estate", title: "ಯೂನಿಟ್", body: "ಯಾವುದೇ ಯೂನಿಟ್ ಒತ್ತಿ ವಿವರ ನೋಡಿ." },
      { icon: "receipt", title: "ಬಿಲ್ಲು", body: "ತಿಂಗಳ ನೀರು ಮತ್ತು ವಿದ್ಯುತ್ ಬಿಲ್ ನಮೂದಿಸಿ." },
      { icon: "speakerphone", title: "ಸಂದೇಶ", body: "ಎಲ್ಲ ಬಾಡಿಗೆದಾರರಿಗೆ WhatsApp ಸಂದೇಶ ಕಳುಹಿಸಿ." },
      { icon: "chart-bar", title: "ವಿಶ್ಲೇಷಣೆ", body: "ಆದಾಯ ಮತ್ತು ಬಾಡಿಗೆ ಸಂಗ್ರಹ ವಿವರ ನೋಡಿ." },
    ],
    routine: "ಪ್ರತಿ ತಿಂಗಳು ಮಾಡಬೇಕಾದದ್ದು",
    routineSteps: ["Bills ಟ್ಯಾಬ್‌ನಲ್ಲಿ ನೀರು ಮತ್ತು ವಿದ್ಯುತ್ ಬಿಲ್ ನಮೂದಿಸಿ","Broadcast ನಲ್ಲಿ ಬಾಡಿಗೆ ಜ್ಞಾಪನೆ ಕಳುಹಿಸಿ","ಬಾಡಿಗೆದಾರರು ಪಾವತಿಸಿದಾಗ ದೃಢೀಕರಿಸಿ","ಸಮಸ್ಯೆ ಟ್ಯಾಬ್ ಪರಿಶೀಲಿಸಿ"],
    mo: "/ತಿಂಗಳು", perMonth: "ತಿಂಗಳಿಗೆ",
    occupied: "ಆಕ್ರಮಿಸಲಾಗಿದೆ", vacant: "ಖಾಲಿ",
    overdue: "ಬಾಕಿ", pending: "ಬಾಕಿ ಇದೆ", paid: "ಪಾವತಿಯಾಗಿದೆ", verifying: "ದೃಢೀಕರಿಸಲಾಗುತ್ತಿದೆ",
    noAgreement: "ಒಪ್ಪಂದ ಇಲ್ಲ", docsRequested: "ದಾಖಲೆ ಕೇಳಲಾಗಿದೆ", docsReceived: "ದಾಖಲೆ ಬಂದಿದೆ",
    noticeGiven: "ನೋಟಿಸ್ ನೀಡಲಾಗಿದೆ",
    monthlyRent: "ತಿಂಗಳ ಬಾಡಿಗೆ", allUnits: "ಎಲ್ಲ ಯೂನಿಟ್", paidUp: "ಪಾವತಿಯಾಗಿದೆ",
    outstanding: "ಬಾಕಿ", collected: "ಸಂಗ್ರಹ", advanceHeld: "ಮುಂಗಡ",
    collectionRate: "ಸಂಗ್ರಹ ದರ",
    overdueAlert: (n) => `${n} ಬಾಡಿಗೆದಾರ${n > 1 ? "ರಿಗೆ" : "ನಿಗೆ"} ಬಾಕಿ ಇದೆ`,
    overdueAlertSub: "ವಿವರ ನೋಡಲು ಯೂನಿಟ್ ಒತ್ತಿರಿ.",
    billsAlert: (m) => `${m} ಬಿಲ್ ನಮೂದಿಸಿಲ್ಲ`,
    billsAlertSub: "ನೀರು ಮತ್ತು ವಿದ್ಯುತ್ ಬಿಲ್ ಸೇರಿಸಲು Bills ತೆರೆಯಿರಿ.",
    verifyPayment: "ಪಾವತಿ ದೃಢೀಕರಿಸಿ",
    verifyDesc: "UPI ಅಧಿಸೂಚನೆ ಪರಿಶೀಲಿಸಿ, ನಂತರ ದೃಢೀಕರಿಸಿ ಅಥವಾ ವಿವಾದ ಮಾಡಿ.",
    confirm: "ದೃಢೀಕರಿಸಿ", dispute: "ವಿವಾದ",
    units: "ಯೂನಿಟ್", since: "ರಿಂದ",
    overview: "ಮಾಹಿತಿ", payments: "ಪಾವತಿ", notice: "ನೋಟಿಸ್",
    phone: "WhatsApp ನಂಬರ್", noPhone: "ಹೊಂದಿಸಿಲ್ಲ", addPhone: "+ ನಂಬರ್ ಸೇರಿಸಿ", editPhone: "ಬದಲಿಸಿ",
    agreement: "ಒಪ್ಪಂದ", requestDocs: "WA ಮೂಲಕ ದಾಖಲೆ ಕೇಳಿ", sendPortal: "WhatsApp ಮೂಲಕ ಪೋರ್ಟಲ್ ಕಳುಹಿಸಿ",
    documents: "ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ದಾಖಲೆಗಳು", noDocs: "ಇನ್ನೂ ದಾಖಲೆಗಳಿಲ್ಲ.",
    markPaid: "ಪಾವತಿ ಆಗಿದೆ", markUnpaid: "ಹಿಂತೆಗೆ", addBills: "+ ಬಿಲ್", saveBills: "ಉಳಿಸಿ",
    addMonth: "+ ಈ ತಿಂಗಳು ಸೇರಿಸಿ",
    noNotice: "ನೋಟಿಸ್ ಇಲ್ಲ", noNoticeDesc: (name) => `${name} ಹೊರಡಲು ಯೋಚಿಸುತ್ತಿದ್ದರೆ ಇಲ್ಲಿ ದಾಖಲಿಸಿ.`,
    recordNotice: "ಹೊರಡುವ ನೋಟಿಸ್ ದಾಖಲಿಸಿ", confirmNotice: "ನೋಟಿಸ್ ದೃಢೀಕರಿಸಿ", cancelNotice: "ನೋಟಿಸ್ ರದ್ದು",
    cancelNoticeSure: "ನೋಟಿಸ್ ರದ್ದು ಮಾಡಬೇಕೇ?",
    settlement: "ಸೆಟಲ್‌ಮೆಂಟ್", advancePaidL: "ಪಾವತಿಸಿದ ಮುಂಗಡ", outstandingDues: "ಬಾಕಿ ಮೊತ್ತ",
    deductions: "ಕಡಿತಗಳು",
    deductionsDesc: "ಮುಂಗಡದಿಂದ ಕಡಿತ ಮಾಡಬೇಕಾದ ಮೊತ್ತ ನಮೂದಿಸಿ.",
    painting: "ಬಣ್ಣ / ಬಿಳುಪು", paintingHint: "2 ವರ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ ಇದ್ದರೆ",
    damages: "ಹಾನಿ ಮತ್ತು ದುರಸ್ತಿ", damagesHint: "ಒಡೆದ ಸಾಧನಗಳು, ಟೈಲ್ಸ್",
    cleaning: "ಶುಚಿಗೊಳಿಸುವ ಶುಲ್ಕ", cleaningHint: "ಮನೆ ಕೊಳಕಾಗಿ ಬಿಟ್ಟಿದ್ದರೆ",
    otherDeduction: "ಇತರ ಕಡಿತ", otherHint: "ಯಾವುದಾದರೂ ಒಪ್ಪಿದ ಮೊತ್ತ",
    finalSettlement: "ಅಂತಿಮ ಸೆಟಲ್‌ಮೆಂಟ್",
    refundTo: (name) => `${name}ಗೆ ಹಿಂತಿರುಗಿ`,
    owes: (name) => `${name} ಕೊಡಬೇಕು`,
    settleAndVacate: "ಸೆಟಲ್‌ಮೆಂಟ್ ದೃಢೀಕರಿಸಿ ಮತ್ತು ಯೂನಿಟ್ ಖಾಲಿ ಮಾಡಿ",
    settledDone: "ಸೆಟಲ್‌ಮೆಂಟ್ ಮುಗಿದಿದೆ.",
    cancelledNotice: "ನೋಟಿಸ್ ರದ್ದಾಗಿದೆ. ಬಾಡಿಗೆದಾರ ಇನ್ನೂ ಇದ್ದಾರೆ.",
    waterBill: "ನೀರಿನ ಬಿಲ್", waterDesc: "ಒಟ್ಟು ಬಿಲ್ · ÷5 ಹಂಚಿಕೆ",
    electricityBills: "ವಿದ್ಯುತ್ ಬಿಲ್", electricityDesc: "Francis ಮತ್ತು Vital ಗೆ ಮಾತ್ರ",
    freeElec: "ಉಚಿತ ಸರ್ಕಾರ ವಿದ್ಯುತ್ · 200 ಯೂನಿಟ್",
    totalDueMonth: "ಈ ತಿಂಗಳು ಒಟ್ಟು",
    saveBillsBtn: (m, y) => `${m} ${y} ಬಿಲ್ ಉಳಿಸಿ`,
    saving: "ಉಳಿಸಲಾಗುತ್ತಿದೆ...", billsSaved: "ಬಿಲ್ ಉಳಿಸಲಾಗಿದೆ!",
    broadcastDesc: "ಟೆಂಪ್ಲೇಟ್ ಆಯ್ಕೆ ಮಾಡಿ ಮತ್ತು ಸ್ವೀಕರಿಸುವವರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ.",
    chooseTemplate: "ಸಂದೇಶ ವಿಧ",
    recipients: "ಸ್ವೀಕರಿಸುವವರು",
    selectAll: "ಎಲ್ಲಾ ಆಯ್ಕೆ", clearAll: "ಎಲ್ಲಾ ತೆಗೆ",
    sendTo: (n) => `${n} ಬಾಡಿಗೆದಾರ${n > 1 ? "ರಿಗೆ" : "ನಿಗೆ"} ಕಳುಹಿಸಿ`,
    chooseFirst: "ಮೇಲೆ ಸಂದೇಶ ವಿಧ ಆಯ್ಕೆ ಮಾಡಿ",
    noNumber: "ನಂಬರ್ ಇಲ್ಲ",
    msgSent: (n) => `${n} ಜನರಿಗೆ ಕಳುಹಿಸಲಾಗಿದೆ!`,
    issues: "ಸಮಸ್ಯೆಗಳು", noIssues: "ಯಾವುದೇ ಸಮಸ್ಯೆ ಇಲ್ಲ",
    noIssuesSub: "ಬಾಡಿಗೆದಾರರು ಅವರ ಪೋರ್ಟಲ್ ಮೂಲಕ ಸಮಸ್ಯೆ ತಿಳಿಸುತ್ತಾರೆ.",
    inProgress: "ಪ್ರಗತಿಯಲ್ಲಿದೆ", resolved: "ಮುಗಿದಿದೆ",
    applications: "ಅರ್ಜಿಗಳು", noApps: "ಇನ್ನೂ ಅರ್ಜಿಗಳಿಲ್ಲ",
    noAppsSub: "ಖಾಲಿ ಯೂನಿಟ್‌ಗೆ ಅರ್ಜಿ ಲಿಂಕ್ ಶೇರ್ ಮಾಡಿ.",
    appPending: "ಬಾಕಿ", appApproved: "ಅನುಮೋದಿಸಲಾಗಿದೆ", appRejected: "ತಿರಸ್ಕರಿಸಲಾಗಿದೆ",
    requestDocuments: "ದಾಖಲೆ ಕೇಳಿ", approveApp: "ಅನುಮೋದಿಸಿ", rejectApp: "ತಿರಸ್ಕರಿಸಿ",
    docsRequestedBadge: "ದಾಖಲೆ ಕೇಳಲಾಗಿದೆ",
    approveAndOnboard: "ಅನುಮೋದಿಸಿ ಮತ್ತು ಬಾಡಿಗೆದಾರ ರಚಿಸಿ",
    share: "ಶೇರ್", copyLink: "ಲಿಂಕ್ ನಕಲಿಸಿ",
    addTenant: "+ ಬಾಡಿಗೆದಾರ ಸೇರಿಸಿ",
    analyticsTitle: "ವಿಶ್ಲೇಷಣೆ", year2026: "2026 ಅವಲೋಕನ",
    revenue: "ಆದಾಯ", tenantHealth: "ಬಾಡಿಗೆದಾರ ಸ್ಥಿತಿ",
    buildingOverview: "ಕಟ್ಟಡ ಅವಲೋಕನ", issuesSummary: "ಸಮಸ್ಯೆ ಸಾರಾಂಶ",
  }
}

// ── SHARED UI ──────────────────────────────────────────────────────────────────
function Pill({ label, color, bg, border }) {
  return (
    <span style={{ background: bg, color, border: `0.5px solid ${border || color + "40"}`, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", alignSelf: "flex-start", lineHeight: 1.5 }}>
      {label}
    </span>
  )
}

function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{ background: C.surface, borderRadius: 16, border: `0.5px solid ${C.border}`, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", ...style }}>
      {children}
    </div>
  )
}

function SectionTitle({ children, action, onAction }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, marginTop: 4 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.09em" }}>{children}</div>
      {action && <button onClick={onAction} style={{ background: "none", border: "none", fontSize: 12, color: C.accent, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>{action}</button>}
    </div>
  )
}

function Sheet({ title, subtitle, onClose, children }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const id = requestAnimationFrame(() => setVisible(true)); return () => cancelAnimationFrame(id) }, [])
  const handleClose = () => { setVisible(false); setTimeout(onClose, 300) }
  return (
    <div onClick={handleClose} style={{ position: "fixed", inset: 0, background: visible ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0)", zIndex: 200, display: "flex", alignItems: "flex-end", backdropFilter: "blur(2px)", transition: "background 0.28s ease" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.surface, borderRadius: "24px 24px 0 0", width: "100%", maxHeight: "93vh", overflowY: "auto", boxShadow: "0 -4px 24px rgba(0,0,0,0.08)", transform: visible ? "translateY(0)" : "translateY(100%)", transition: "transform 0.32s cubic-bezier(0.32,0.72,0,1)" }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "14px 0 8px" }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border }} />
        </div>
        <div style={{ padding: "0 20px 16px", borderBottom: `0.5px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: C.text }}>{title}</div>
            {subtitle && <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button onClick={handleClose} style={{ width: 34, height: 34, borderRadius: 10, background: C.bg, border: `0.5px solid ${C.border}`, cursor: "pointer", color: C.muted, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        <div style={{ padding: "18px 20px 48px" }}>{children}</div>
      </div>
    </div>
  )
}

const iStyle = { width: "100%", padding: "11px 14px", background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, fontSize: 16, color: C.text, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</label>
        {hint && <span style={{ fontSize: 11, color: C.muted }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function UnitPill(status, lt) {
  if (status === "Paid") return <Pill label={lt.paid} color={C.green} bg={C.greenSoft} border={C.greenBorder} />
  if (status === "Overdue") return <Pill label={lt.overdue} color={C.red} bg={C.redSoft} border={C.redBorder} />
  if (status === "Verifying") return <Pill label={lt.verifying} color={C.accent} bg={C.accentSoft} border={C.accentBorder} />
  return <Pill label={lt.pending} color={C.amber} bg={C.amberSoft} border={C.amberBorder} />
}

// ── HOME TAB ────────────────────────────────────────────────────────────────────
function HomeTab({ units, tenants, activeNotices, payments, onSelectTenant, setTenants, setPayments, currentMonth, currentYear }) {
  const lt = useLT()
  const [disputingId, setDisputingId] = useState(null)
  const DISPUTE_REASONS = ["Amount doesn't match", "Not received yet", "Wrong month"]
  const overdueCount = tenants.filter(t => t.payment_status === "Overdue").length
  const billsMissing = !payments.some(p => p.month === currentMonth && p.year === currentYear && (p.water_bill > 0))
  const verifyingPayments = payments.filter(p => p.verification_status === "Pending Verification")
  const totalRent = tenants.reduce((s, t) => s + Number(t.rent), 0)
  const collectedThisMonth = payments.filter(p => p.month === currentMonth && p.year === currentYear && p.status === "Paid").reduce((s, p) => s + Number(p.total_due || p.amount), 0)
  const outstandingTotal = payments.filter(p => p.status === "Unpaid" && p.verification_status !== "Pending Verification").reduce((s, p) => s + Number(p.total_due || p.amount), 0)

  const confirmPayment = async (payment) => {
    await supabase.from("payment_records").update({ status: "Paid", verification_status: "Confirmed", paid_on: new Date().toISOString().split("T")[0] }).eq("id", payment.id)
    setPayments(ps => ps.map(p => p.id === payment.id ? { ...p, status: "Paid", verification_status: "Confirmed" } : p))
    const tenant = tenants.find(t => t.id === payment.tenant_id)
    if (tenant) {
      await supabase.from("tenants").update({ payment_status: "Paid" }).eq("id", tenant.id)
      setTenants(ts => ts.map(t => t.id === tenant.id ? { ...t, payment_status: "Paid" } : t))
    }
    notifyTenant(payment.tenant_id, "Payment confirmed", `Your ${MONTHS[payment.month - 1]} ${payment.year} payment of ${fmt(payment.total_due || payment.amount)} is confirmed. Thank you!`)
    toast("Payment confirmed, tenant notified")
    logAudit(`Confirmed ${tenant?.name || "tenant"} ${MONTHS[payment.month - 1]} ${payment.year} payment`)
  }

  const disputePayment = async (payment, reason) => {
    const trimmed = (reason || "").trim() || null
    let { error } = await supabase.from("payment_records").update({ verification_status: "Disputed", dispute_reason: trimmed }).eq("id", payment.id)
    if (error) {
      // dispute_reason column may not exist yet; fall back to disputing without it
      await supabase.from("payment_records").update({ verification_status: "Disputed" }).eq("id", payment.id)
    }
    setPayments(ps => ps.map(p => p.id === payment.id ? { ...p, verification_status: "Disputed", dispute_reason: trimmed } : p))
    notifyTenant(payment.tenant_id, "Payment needs attention", trimmed ? `Your ${MONTHS[payment.month - 1]} payment could not be confirmed: ${trimmed}` : `Your ${MONTHS[payment.month - 1]} payment could not be confirmed. Please review and pay again.`, "/")
    toast("Marked as disputed, tenant notified", "info")
    logAudit(`Disputed ${tenants.find(t => t.id === payment.tenant_id)?.name || "tenant"} ${MONTHS[payment.month - 1]} payment${trimmed ? ` (${trimmed})` : ""}`)
  }

  const remindAllOverdue = () => {
    const overdueTenants = tenants.filter(t => t.payment_status === "Overdue")
    overdueTenants.forEach(t => notifyTenant(t.id, "Rent reminder", "Your rent is overdue. Please open the app to pay at your earliest. Thank you.", "/"))
    toast(`Reminder sent to ${overdueTenants.length} tenant${overdueTenants.length === 1 ? "" : "s"}`)
  }

  return (
    <div>
      {/* Alerts */}
      {overdueCount > 0 && (
        <div style={{ background: C.redSoft, border: `0.5px solid ${C.redBorder}`, borderRadius: 16, padding: "14px 16px", marginBottom: 10, boxShadow: "0 1px 3px rgba(220,38,38,0.08)" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.red }}>{lt.overdueAlert(overdueCount)}</div>
              <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 2 }}>{lt.overdueAlertSub}</div>
            </div>
          </div>
          <button onClick={remindAllOverdue}
            style={{ width: "100%", marginTop: 12, padding: "10px", background: C.red, border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, color: "#fff", fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            Remind all overdue
          </button>
        </div>
      )}
      {billsMissing && (
        <div style={{ background: C.amberSoft, border: `0.5px solid ${C.amberBorder}`, borderRadius: 16, padding: "14px 16px", marginBottom: 10, display: "flex", gap: 10, alignItems: "flex-start", boxShadow: "0 1px 3px rgba(217,119,6,0.08)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.amber} strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.amber }}>{lt.billsAlert(MONTHS[currentMonth - 1])}</div>
            <div style={{ fontSize: 12, color: "#92400e", marginTop: 2 }}>{lt.billsAlertSub}</div>
          </div>
        </div>
      )}

      {/* Verification cards */}
      {verifyingPayments.map(p => {
        const tenant = tenants.find(t => t.id === p.tenant_id)
        const unit = units.find(u => u.id === p.unit_id)
        if (!tenant) return null
        return (
          <div key={p.id} style={{ background: C.surface, borderRadius: 14, border: `1.5px solid ${C.accentBorder}`, padding: 16, marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{tenant.name} · Unit {unit?.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{lt.verifyPayment} · {MONTHS[p.month - 1]} {p.year}</div>
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.accent, letterSpacing: "-0.5px", marginBottom: 4 }}>{fmt(p.total_due || p.amount)}</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>{lt.verifyDesc}</div>
            {disputingId === p.id ? (
              <div>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 8 }}>Why? (the tenant will see this)</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {DISPUTE_REASONS.map(r => (
                    <button key={r} onClick={() => { disputePayment(p, r); setDisputingId(null) }}
                      style={{ padding: "9px 12px", background: C.redSoft, border: `0.5px solid ${C.redBorder}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: "#991b1b", fontSize: 12, fontFamily: "inherit" }}>
                      {r}
                    </button>
                  ))}
                  <button onClick={() => { disputePayment(p, ""); setDisputingId(null) }}
                    style={{ padding: "9px 12px", background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: C.sub, fontSize: 12, fontFamily: "inherit" }}>
                    Other reason
                  </button>
                </div>
                <button onClick={() => setDisputingId(null)}
                  style={{ width: "100%", padding: "9px", background: "none", border: "none", color: C.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button onClick={() => confirmPayment(p)} style={{ padding: "11px", background: C.greenSoft, border: `0.5px solid ${C.greenBorder}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: "#065f46", fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  {lt.confirm}
                </button>
                <button onClick={() => setDisputingId(p.id)} style={{ padding: "11px", background: C.redSoft, border: `0.5px solid ${C.redBorder}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: "#991b1b", fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  {lt.dispute}
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 16 }}>
        {[
          [lt.collected, fmt(collectedThisMonth), C.green],
          [lt.outstanding, fmt(outstandingTotal), outstandingTotal > 0 ? C.red : C.green],
          [lt.monthlyRent, fmt(totalRent), C.accent],
          [lt.collectionRate, `${Math.round((tenants.filter(t => t.payment_status === "Paid").length / Math.max(tenants.length, 1)) * 100)}%`, C.blue],
        ].map(([l, v, color]) => (
          <div key={l} style={{ background: C.surface, borderRadius: 16, border: `0.5px solid ${C.border}`, padding: "16px 14px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{l}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: "-0.5px" }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Active notices */}
      {activeNotices.length > 0 && (
        <div style={{ background: "#faf5ff", border: `0.5px solid #c4b5fd`, borderRadius: 14, padding: "13px 14px", marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#6d28d9", marginBottom: 6 }}>
            {activeNotices.length} notice{activeNotices.length > 1 ? "s" : ""} to vacate
          </div>
          {activeNotices.map(n => {
            const t = tenants.find(x => x.id === n.tenant_id)
            const u = units.find(x => x.id === n.unit_id)
            return <div key={n.id} style={{ fontSize: 12, color: "#7c3aed", marginTop: 3 }}>{t?.name} · {u?.name} · Moving out {fmtDate(n.move_out_date)}</div>
          })}
        </div>
      )}

      <SectionTitle>{lt.units}</SectionTitle>
      {units.map(unit => {
        const tenant = tenants.find(t => t.unit_id === unit.id)
        if (!tenant) return null
        const hasNotice = activeNotices.some(n => n.tenant_id === tenant?.id)
        const isVerifying = verifyingPayments.some(p => p.tenant_id === tenant?.id)
        return (
          <div key={unit.id} onClick={() => tenant && onSelectTenant(tenant, unit)}
            style={{ background: C.surface, borderRadius: 16, border: `0.5px solid ${tenant?.payment_status === "Overdue" ? C.redBorder : hasNotice ? "#c4b5fd" : C.border}`, padding: "13px 14px", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "transform 0.12s ease, box-shadow 0.12s ease" }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: tenant?.payment_status === "Overdue" ? C.redSoft : C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: tenant?.payment_status === "Overdue" ? C.red : C.accent }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{unit.name} · {tenant?.name || lt.vacant}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{unit.floor} · {unit.type}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{fmt(unit.rent)}</div>
              <div style={{ marginTop: 4 }}>
                {isVerifying ? UnitPill("Verifying", lt) : UnitPill(tenant?.payment_status, lt)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── UNITS TAB ────────────────────────────────────────────────────────────────────
function UnitsTab({ units, tenants, activeNotices, applications, onSelectTenant, setTenants, setUnits, setApplications }) {
  const lt = useLT()
  const [shareSheet, setShareSheet] = useState(null)
  const [addTenantSheet, setAddTenantSheet] = useState(null)
  const [appSheet, setAppSheet] = useState(null)
  const [copied, setCopied] = useState(false)

  const [waitlist, setWaitlist] = useState([])
  useEffect(() => {
    supabase.from("waitlist").select("*").eq("status", "Waiting").order("id", { ascending: false }).then(({ data }) => { if (data) setWaitlist(data) })
  }, [])

  const pendingApps = applications.filter(a => a.status === "Pending")

  const contactWaitlist = (w) => {
    const msg = encodeURIComponent(`Hi ${w.name}! A flat has opened up in our building. Are you still looking? You can apply here: ${window.location.origin}/apply`)
    window.open(`https://wa.me/${w.phone}?text=${msg}`, "_blank")
  }
  const removeWaitlist = async (id) => {
    await supabase.from("waitlist").update({ status: "Removed" }).eq("id", id)
    setWaitlist(ws => ws.filter(w => w.id !== id))
    toast("Removed from waitlist", "info")
  }

  const copyLink = (unitName) => {
    navigator.clipboard.writeText(`${window.location.origin}/apply/${unitName}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const requestDocs = async (app) => {
    const appLink = `${window.location.origin}/apply/${app.unit_name}?app=${app.id}`
    const msg = encodeURIComponent(`Hi ${app.name}! We are interested in your application for Unit ${app.unit_name}.\n\nPlease upload your Aadhaar and PAN card through your application page:\n${appLink}\n\nThis will help us process your application faster. Thank you!`)
    window.open(`https://wa.me/${app.phone}?text=${msg}`, "_blank")
    await supabase.from("applications").update({ docs_requested: true }).eq("id", app.id)
    setApplications(as => as.map(a => a.id === app.id ? { ...a, docs_requested: true } : a))
  }

  const rejectApp = async (app) => {
    const msg = encodeURIComponent(`Hi ${app.name}, thank you for applying for Unit ${app.unit_name}. Unfortunately we are unable to accommodate your application at this time. We wish you the best in finding a suitable place.`)
    window.open(`https://wa.me/${app.phone}?text=${msg}`, "_blank")
    await supabase.from("applications").update({ status: "Rejected" }).eq("id", app.id)
    await deleteApplicantDocs(app.id)
    setApplications(as => as.filter(a => a.id !== app.id))
  }

  return (
    <div>
      <div style={{ background: pendingApps.length > 0 ? C.accentSoft : C.surface, border: `0.5px solid ${pendingApps.length > 0 ? C.accentBorder : C.border}`, borderRadius: 14, padding: "13px 14px", marginBottom: 12, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
        onClick={() => setAppSheet(true)}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: pendingApps.length > 0 ? C.accent : C.text }}>
            {pendingApps.length > 0 ? `${pendingApps.length} pending application${pendingApps.length > 1 ? "s" : ""}` : "Applications"}
          </div>
          <div style={{ fontSize: 12, color: pendingApps.length > 0 ? "#6d5ad6" : C.muted, marginTop: 2 }}>
            {pendingApps.length > 0 ? "Tap to review" : `${applications.length} total · tap to view`}
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={pendingApps.length > 0 ? C.accent : C.muted} strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
      </div>

      {waitlist.length > 0 && (
        <div style={{ background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "13px 14px", marginBottom: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>Waitlist · {waitlist.length}</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>People waiting for a flat to open</div>
          {waitlist.map(w => (
            <div key={w.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: `0.5px solid ${C.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{w.name}{w.household_type ? <span style={{ color: C.muted, fontWeight: 400 }}> · {w.household_type}</span> : ""}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{[w.vehicles && `${w.vehicles} vehicle`, w.current_address].filter(Boolean).join(" · ") || "—"}</div>
              </div>
              <button onClick={() => contactWaitlist(w)} style={{ padding: "6px 12px", background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: C.accent, fontSize: 12, fontFamily: "inherit" }}>Message</button>
              <button onClick={() => removeWaitlist(w.id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 16, padding: 4, fontFamily: "inherit" }}>×</button>
            </div>
          ))}
        </div>
      )}

      {units.map(unit => {
        const tenant = tenants.find(t => t.unit_id === unit.id && t.status === "Active")
        const hasNotice = activeNotices.some(n => n.tenant_id === tenant?.id)
        const unitApps = applications.filter(a => a.unit_id === unit.id && a.status === "Pending")
        const isVacant = !tenant || unit.status === "Vacant"

        return (
          <div key={unit.id} style={{ background: C.surface, borderRadius: 16, border: `0.5px solid ${isVacant ? C.accentBorder : hasNotice ? "#c4b5fd" : tenant?.payment_status === "Overdue" ? C.redBorder : C.border}`, padding: 16, marginBottom: 10, cursor: isVacant ? "default" : "pointer" }}
            onClick={() => !isVacant && tenant && onSelectTenant(tenant, unit)}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: tenant ? 12 : 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: isVacant ? C.accentSoft : C.bg, border: `0.5px solid ${isVacant ? C.accentBorder : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: isVacant ? C.accent : C.muted }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{unit.name}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{unit.floor} · {unit.type}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{fmt(unit.rent)}</div>
                <div style={{ fontSize: 11, color: C.muted }}>{lt.mo}</div>
              </div>
            </div>

            {tenant && (
              <div style={{ borderTop: `0.5px solid ${C.border}`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: C.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: C.accent }}>
                    {tenant.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{tenant.name}</div>
                    <div style={{ fontSize: 11, color: C.muted }}>{lt.since} {fmtDate(tenant.joined_date)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {UnitPill(tenant.payment_status, lt)}
                  {tenant.agreement_status === "Pending" && <Pill label={lt.noAgreement} color={C.red} bg={C.redSoft} border={C.redBorder} />}
                  {tenant.agreement_status === "Requested" && <Pill label={lt.docsRequested} color={C.amber} bg={C.amberSoft} border={C.amberBorder} />}
                  {tenant.agreement_status === "Documents Submitted" && <Pill label={lt.docsReceived} color={C.green} bg={C.greenSoft} border={C.greenBorder} />}
                  {hasNotice && <Pill label={lt.noticeGiven} color="#7c3aed" bg="#f5f3ff" border="#c4b5fd" />}
                </div>
              </div>
            )}

            {isVacant && (
              <div style={{ borderTop: `0.5px solid ${C.border}`, paddingTop: 12 }}>
                {unitApps.length > 0 && (
                  <div style={{ fontSize: 12, color: C.accent, marginBottom: 8, fontWeight: 500 }}>{unitApps.length} application{unitApps.length > 1 ? "s" : ""} pending review</div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={(e) => { e.stopPropagation(); setShareSheet(unit) }}
                    style={{ flex: 1, padding: "9px", background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: C.accent, fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                    {lt.share} link
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setAddTenantSheet(unit) }}
                    style={{ flex: 1, padding: "9px", background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: C.sub, fontSize: 13, fontFamily: "inherit" }}>
                    {lt.addTenant}
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Share sheet */}
      {shareSheet && (
        <Sheet title={`Share Unit ${shareSheet.name}`} subtitle={`${shareSheet.floor} · ${shareSheet.type}`} onClose={() => setShareSheet(null)}>
          <div style={{ background: C.bg, borderRadius: 12, padding: "12px 14px", marginBottom: 16, border: `0.5px solid ${C.border}` }}>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Application link</div>
            <div style={{ fontSize: 13, color: C.accent, wordBreak: "break-all" }}>{window.location.origin}/apply/{shareSheet.name}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <button onClick={() => copyLink(shareSheet.name)}
              style={{ padding: "13px", background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, cursor: "pointer", fontWeight: 600, color: C.text, fontSize: 14, fontFamily: "inherit" }}>
              {copied ? "Copied!" : lt.copyLink}
            </button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Hi! We have a ${shareSheet.type} available at ${shareSheet.floor} for ${fmt(shareSheet.rent)}/mo. Apply here: ${window.location.origin}/apply/${shareSheet.name}`)}`}
              target="_blank" rel="noreferrer"
              style={{ padding: "13px", background: "#dcfce7", border: `0.5px solid #6ee7b7`, borderRadius: 12, cursor: "pointer", fontWeight: 600, color: "#065f46", fontSize: 14, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
              WhatsApp
            </a>
          </div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
            Anyone with this link can submit an application. You review and approve before they become a tenant.
          </div>
        </Sheet>
      )}

      {/* Add tenant directly sheet */}
      {addTenantSheet && (
        <AddTenantSheet unit={addTenantSheet} onClose={() => setAddTenantSheet(null)} setTenants={setTenants} setUnits={setUnits} />
      )}

      {/* Applications review sheet */}
      {appSheet && (
        <Sheet title={lt.applications} subtitle={`${pendingApps.length} pending · ${applications.length} total`} onClose={() => setAppSheet(null)}>
          {applications.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32 }}>
              <div style={{ fontSize: 14, color: C.muted }}>{lt.noApps}</div>
            </div>
          ) : (
            <>
              {pendingApps.map(app => (
                <ApplicationCard key={app.id} app={app} units={units} onRequestDocs={requestDocs} onReject={rejectApp} setApplications={setApplications} setTenants={setTenants} setUnits={setUnits} onClose={() => setAppSheet(null)} />
              ))}
              {applications.filter(a => a.status !== "Pending").length > 0 && (
                <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", margin: "16px 0 8px" }}>History</div>
              )}
              {applications.filter(a => a.status !== "Pending").map(app => (
                <div key={app.id} style={{ background: C.surface, borderRadius: 12, border: `0.5px solid ${C.border}`, padding: "12px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{app.name}</div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>Unit {app.unit_name} · {fmtDate(app.applied_at)}</div>
                  </div>
                  {app.status === "Approved"
                    ? <Pill label="Approved" color={C.green} bg={C.greenSoft} border={C.greenBorder} />
                    : <Pill label="Rejected" color={C.muted} bg={C.bg} border={C.border} />}
                </div>
              ))}
            </>
          )}
        </Sheet>
      )}
    </div>
  )
}

function ApplicationCard({ app, units, onRequestDocs, onReject, setApplications, setTenants, setUnits, onClose }) {
  const lt = useLT()
  const [approving, setApproving] = useState(false)
  const [approveForm, setApproveForm] = useState({ rent: "", advance: "", move_in: "" })

  const unit = units.find(u => u.id === app.unit_id)

  const handleApprove = async () => {
    if (!approveForm.rent || !approveForm.advance || !approveForm.move_in) { alert("Please fill in rent, advance, and move-in date."); return }
    const token = crypto.randomUUID()
    const { data: tenant } = await supabase.from("tenants").insert([{
      unit_id: app.unit_id, name: app.name, phone: app.phone,
      rent: Number(approveForm.rent), advance_amount: Number(approveForm.advance),
      advance_paid: true, joined_date: new Date(approveForm.move_in).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      move_in_date: approveForm.move_in, status: "Active", payment_status: "Pending",
      agreement_status: "Pending", portal_token: token, reminders: [],
    }]).select().single()

    if (tenant) {
      await supabase.from("units").update({ status: "Occupied" }).eq("id", app.unit_id)
      await supabase.from("applications").update({ status: "Approved" }).eq("id", app.id)
      const now = new Date()
      await supabase.from("payment_records").insert([{
        tenant_id: tenant.id, unit_id: app.unit_id, month: now.getMonth() + 1, year: now.getFullYear(),
        amount: Number(approveForm.rent), water_bill: 0, electricity_bill: 0, total_due: Number(approveForm.rent), status: "Unpaid",
      }])
      const portalLink = `${window.location.origin}/tenant/${token}`
      const msg = encodeURIComponent(`Hi ${app.name}! 🎉 Your application for Unit ${app.unit_name} has been approved!\n\nWelcome to your new home. Here is your personal tenant portal:\n${portalLink}\n\nYou can use it to pay rent, upload documents, and report any issues.\n\nPlease open the link in Safari or Chrome and tap "Add to Home Screen" to install it as an app.\n\nLooking forward to having you here! 🏠`)
      window.open(`https://wa.me/${app.phone}?text=${msg}`, "_blank")
      await deleteApplicantDocs(app.id)
      setTenants(ts => [...ts, tenant])
      setUnits(us => us.map(u => u.id === app.unit_id ? { ...u, status: "Occupied" } : u))
      setApplications(as => as.filter(a => a.id !== app.id))
      onClose()
    }
  }

  return (
    <div style={{ background: C.bg, borderRadius: 14, border: `0.5px solid ${C.border}`, padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: C.accent, flexShrink: 0 }}>
          {app.name.charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{app.name}</div>
            {app.docs_requested && <Pill label={lt.docsRequestedBadge} color={C.accent} bg={C.accentSoft} border={C.accentBorder} />}
          </div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Applied for Unit {app.unit_name} · {new Date(app.applied_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[["Occupation", app.occupation], ["Income", app.monthly_income], ["People", app.people_count], ["Move-in", app.preferred_move_in], ["Household", app.household_type], ["Vehicles", app.vehicles], ["Current address", app.current_address]].filter(([, v]) => v).map(([l, v]) => (
          <div key={l} style={{ background: C.surface, borderRadius: 10, padding: "9px 12px", border: `0.5px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>{l}</div>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{v}</div>
          </div>
        ))}
      </div>

      {app.message && (
        <div style={{ background: C.surface, borderRadius: 10, padding: "10px 12px", marginBottom: 12, border: `0.5px solid ${C.border}`, fontSize: 13, color: C.sub, lineHeight: 1.6, fontStyle: "italic" }}>
          "{app.message}"
        </div>
      )}

      {!approving ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <button onClick={() => onRequestDocs(app)}
            style={{ padding: "10px 8px", background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: C.accent, fontSize: 12, fontFamily: "inherit" }}>
            {lt.requestDocuments}
          </button>
          <button onClick={() => setApproving(true)}
            style={{ padding: "10px 8px", background: C.greenSoft, border: `0.5px solid ${C.greenBorder}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: "#065f46", fontSize: 12, fontFamily: "inherit" }}>
            {lt.approveApp}
          </button>
          <button onClick={() => onReject(app)}
            style={{ padding: "10px 8px", background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: C.muted, fontSize: 12, fontFamily: "inherit" }}>
            {lt.rejectApp}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>{lt.approveAndOnboard}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <Field label="Monthly rent">
              <input style={iStyle} type="number" placeholder={fmt(unit?.rent || 0)} value={approveForm.rent} onChange={e => setApproveForm(f => ({ ...f, rent: e.target.value }))} />
            </Field>
            <Field label="Advance">
              <input style={iStyle} type="number" placeholder={fmt(unit?.advance || 0)} value={approveForm.advance} onChange={e => setApproveForm(f => ({ ...f, advance: e.target.value }))} />
            </Field>
          </div>
          <Field label="Move-in date">
            <input style={iStyle} type="date" value={approveForm.move_in} onChange={e => setApproveForm(f => ({ ...f, move_in: e.target.value }))} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
            <button onClick={() => setApproving(false)} style={{ padding: "12px", background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, cursor: "pointer", fontWeight: 600, color: C.muted, fontFamily: "inherit" }}>Cancel</button>
            <button onClick={handleApprove} style={{ padding: "12px", background: C.green, border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 600, color: "#fff", fontFamily: "inherit" }}>Confirm & send portal</button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddTenantSheet({ unit, onClose, setTenants, setUnits }) {
  const lt = useLT()
  const [form, setForm] = useState({ name: "", phone: "", rent: String(unit.rent), advance: String(unit.advance || ""), move_in: "" })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.name || !form.move_in) { alert("Name and move-in date are required."); return }
    setSaving(true)
    const token = crypto.randomUUID()
    const { data: tenant } = await supabase.from("tenants").insert([{
      unit_id: unit.id, name: form.name.trim(), phone: form.phone.trim(),
      rent: Number(form.rent), advance_amount: Number(form.advance),
      advance_paid: true, joined_date: new Date(form.move_in).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
      move_in_date: form.move_in, status: "Active", payment_status: "Pending",
      agreement_status: "Pending", portal_token: token, reminders: [],
    }]).select().single()

    if (tenant) {
      await supabase.from("units").update({ status: "Occupied" }).eq("id", unit.id)
      const now = new Date()
      await supabase.from("payment_records").insert([{
        tenant_id: tenant.id, unit_id: unit.id, month: now.getMonth() + 1, year: now.getFullYear(),
        amount: Number(form.rent), water_bill: 0, electricity_bill: 0, total_due: Number(form.rent), status: "Unpaid",
      }])
      setTenants(ts => [...ts, tenant])
      setUnits(us => us.map(u => u.id === unit.id ? { ...u, status: "Occupied" } : u))

      if (form.phone) {
        const portalLink = `${window.location.origin}/tenant/${token}`
        const msg = encodeURIComponent(`Hi ${form.name}! Welcome to Unit ${unit.name}. Here is your tenant portal:\n${portalLink}\n\nYou can pay rent, upload documents, and report issues here. Open in Safari and tap "Add to Home Screen" to install as an app.`)
        window.open(`https://wa.me/${form.phone}?text=${msg}`, "_blank")
      }
      onClose()
    }
    setSaving(false)
  }

  return (
    <Sheet title={lt.addTenant} subtitle={`Unit ${unit.name} · ${unit.floor}`} onClose={onClose}>
      <Field label="Full name *"><input style={iStyle} placeholder="Tenant name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
      <Field label="WhatsApp number"><input style={iStyle} placeholder="10-digit number" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="Monthly rent"><input style={iStyle} type="number" value={form.rent} onChange={e => setForm(f => ({ ...f, rent: e.target.value }))} /></Field>
        <Field label="Advance amount"><input style={iStyle} type="number" value={form.advance} onChange={e => setForm(f => ({ ...f, advance: e.target.value }))} /></Field>
      </div>
      <Field label="Move-in date *"><input style={iStyle} type="date" value={form.move_in} onChange={e => setForm(f => ({ ...f, move_in: e.target.value }))} /></Field>
      <button onClick={handleSave} disabled={saving}
        style={{ width: "100%", padding: "15px", background: saving ? C.bg : C.accent, border: "none", borderRadius: 14, cursor: saving ? "default" : "pointer", fontWeight: 700, color: saving ? C.muted : "#fff", fontSize: 15, fontFamily: "inherit" }}>
        {saving ? "Saving..." : "Save and send portal link"}
      </button>
    </Sheet>
  )
}

// ── TENANT DETAIL ──────────────────────────────────────────────────────────────
function TenantDetail({ tenant, unit, onClose, setTenants, setUnits, setActiveNotices, allPayments, setAllPayments }) {
  const lt = useLT()
  const [tab, setTab] = useState("overview")
  const [payments, setPayments] = useState([])
  const [notice, setNotice] = useState(null)
  const [tenantDocs, setTenantDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingPhone, setEditingPhone] = useState(false)
  const [phoneVal, setPhoneVal] = useState(tenant.phone || "")
  const [editingPayment, setEditingPayment] = useState(null)
  const [billForm, setBillForm] = useState({ water_bill: "", electricity_bill: "", notes: "" })
  const [showNoticeForm, setShowNoticeForm] = useState(false)
  const [moveOutDate, setMoveOutDate] = useState("")
  const [agreementDoc, setAgreementDoc] = useState(null)
  const [uploadingAgreement, setUploadingAgreement] = useState(false)

  const paysWater = WATER_UNIT_IDS.includes(unit.id)
  const paysElec = ELEC_TENANT_IDS.includes(tenant.id)

  useEffect(() => {
    Promise.all([
      supabase.from("payment_records").select("*").eq("tenant_id", tenant.id).order("year").order("month"),
      supabase.from("notices").select("*").eq("tenant_id", tenant.id).order("id", { ascending: false }).limit(1),
      supabase.storage.from("documents").list(`${tenant.id}`, { limit: 50 }),
      supabase.storage.from("documents").list(`agreements/${tenant.id}`, { limit: 10 }),
    ]).then(async ([{ data: p }, { data: n }, { data: files }, { data: agFiles }]) => {
      if (p) setPayments(p)
      if (n && n.length > 0) setNotice(n[0])
      if (files && files.length > 0) {
        const docs = await Promise.all(files.map(async f => {
          const { data: u } = await supabase.storage.from("documents").createSignedUrl(`${tenant.id}/${f.name}`, 3600)
          return { name: f.name, url: u?.signedUrl }
        }))
        setTenantDocs(docs.filter(d => d.url))
      }
      if (agFiles && agFiles.length > 0) {
        const latest = agFiles[agFiles.length - 1]
        const { data: u } = await supabase.storage.from("documents").createSignedUrl(`agreements/${tenant.id}/${latest.name}`, 3600)
        if (u?.signedUrl) setAgreementDoc({ name: latest.name, url: u.signedUrl })
      }
      setLoading(false)
    })
  }, [tenant.id])

  const uploadAgreement = async (file) => {
    if (!file) return
    setUploadingAgreement(true)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const path = `agreements/${tenant.id}/${Date.now()}_${safeName}`
    const { error: upErr } = await supabase.storage.from("documents").upload(path, file, { upsert: false })
    if (upErr) { alert("Upload failed: " + upErr.message); setUploadingAgreement(false); return }
    const { data: u } = await supabase.storage.from("documents").createSignedUrl(path, 3600)
    if (u?.signedUrl) setAgreementDoc({ name: `${Date.now()}_${safeName}`, url: u.signedUrl })
    await supabase.from("tenants").update({ agreement_status: "Complete" }).eq("id", tenant.id)
    setTenants(ts => ts.map(t => t.id === tenant.id ? { ...t, agreement_status: "Complete" } : t))
    tenant.agreement_status = "Complete"
    setUploadingAgreement(false)
    toast("Agreement uploaded")
    logAudit(`Uploaded agreement for ${tenant.name}`)
  }

  const outstanding = payments.filter(p => p.status === "Unpaid").reduce((s, p) => s + Number(p.total_due || p.amount), 0)

  const togglePayment = async (p) => {
    const newStatus = p.status === "Paid" ? "Unpaid" : "Paid"
    const paidOn = newStatus === "Paid" ? new Date().toISOString().split("T")[0] : null
    await supabase.from("payment_records").update({ status: newStatus, paid_on: paidOn, verification_status: newStatus === "Paid" ? "Confirmed" : null }).eq("id", p.id)
    const updated = payments.map(x => x.id === p.id ? { ...x, status: newStatus, paid_on: paidOn, verification_status: newStatus === "Paid" ? "Confirmed" : null } : x)
    setPayments(updated)
    const unpaid = updated.filter(x => x.status === "Unpaid" && x.verification_status !== "Pending Verification")
    const newPayStatus = unpaid.length === 0 ? "Paid" : unpaid.some(x => isOverdue(x.month, x.year)) ? "Overdue" : "Pending"
    await supabase.from("tenants").update({ payment_status: newPayStatus }).eq("id", tenant.id)
    setTenants(ts => ts.map(t => t.id === tenant.id ? { ...t, payment_status: newPayStatus } : t))
    if (setAllPayments) setAllPayments(ps => ps.map(x => x.id === p.id ? { ...x, status: newStatus, paid_on: paidOn } : x))
  }

  const updateBills = async (p) => {
    const water = Number(billForm.water_bill) || 0
    const electricity = Number(billForm.electricity_bill) || 0
    const total = Number(p.amount) + water + electricity
    await supabase.from("payment_records").update({ water_bill: water, electricity_bill: electricity, total_due: total, notes: billForm.notes }).eq("id", p.id)
    setPayments(ps => ps.map(x => x.id === p.id ? { ...x, water_bill: water, electricity_bill: electricity, total_due: total, notes: billForm.notes } : x))
    setEditingPayment(null)
    toast("Bill updated")
  }

  const addPaymentMonth = async () => {
    const now = new Date()
    if (payments.find(p => p.month === now.getMonth() + 1 && p.year === now.getFullYear())) { toast("This month already exists", "error"); return }
    const { data } = await supabase.from("payment_records").insert([{
      tenant_id: tenant.id, unit_id: unit.id, month: now.getMonth() + 1, year: now.getFullYear(),
      amount: tenant.rent, water_bill: 0, electricity_bill: 0, total_due: tenant.rent, status: "Unpaid",
    }]).select().single()
    if (data) { setPayments(ps => [...ps, data]); if (setAllPayments) setAllPayments(ps => [...ps, data]); toast("Month added") }
  }

  const submitNotice = async () => {
    if (!moveOutDate) return
    const settlement = Number(tenant.advance_amount) - outstanding
    const { data } = await supabase.from("notices").insert([{
      tenant_id: tenant.id, unit_id: unit.id,
      notice_date: new Date().toISOString().split("T")[0], move_out_date: moveOutDate,
      advance_amount: tenant.advance_amount, outstanding_dues: outstanding,
      settlement_amount: Math.abs(settlement), landlord_pays: settlement > 0, status: "Active",
    }]).select().single()
    if (data) { setNotice(data); setShowNoticeForm(false); setActiveNotices && setActiveNotices(ns => [...ns, data]) }
  }

  const deleteIdDocs = async () => {
    if (!window.confirm("Permanently delete this tenant's Aadhaar/PAN files? Do this only after you've verified them. This cannot be undone.")) return
    const paths = tenantDocs.map(d => `${tenant.id}/${d.name}`)
    if (!paths.length) { toast("No documents to delete", "info"); return }
    const { error } = await supabase.storage.from("documents").remove(paths)
    if (error) { toast("Could not delete documents", "error"); return }
    setTenantDocs([])
    toast("ID documents deleted")
    logAudit(`Deleted ID documents for ${tenant.name}`)
  }

  const sendPortal = () => {
    const link = `${window.location.origin}/tenant/${tenant.portal_token}`
    const msg = encodeURIComponent(`Hi ${tenant.name}! Here is your tenant portal for Unit ${unit.name}:\n${link}\n\nYou can pay rent, upload documents, report issues, and more. Open in Safari and tap "Add to Home Screen" to install as an app.`)
    window.open(`https://wa.me/${tenant.phone}?text=${msg}`, "_blank")
  }

  const viewAsTenant = () => {
    // Open the tenant's portal exactly as they see it (landlord-only admin peek)
    window.open(`${window.location.origin}/tenant/${tenant.portal_token}?admin=1`, "_blank")
  }

  const requestAgreement = async () => {
    const link = `${window.location.origin}/tenant/${tenant.portal_token}`
    const msg = encodeURIComponent(`Hi ${tenant.name}, we are updating rental agreements. Please upload your Aadhaar and PAN card through your portal:\n${link}\n\nThank you!`)
    window.open(`https://wa.me/${tenant.phone}?text=${msg}`, "_blank")
    await supabase.from("tenants").update({ agreement_status: "Requested" }).eq("id", tenant.id)
    setTenants(ts => ts.map(t => t.id === tenant.id ? { ...t, agreement_status: "Requested" } : t))
  }

  return (
    <Sheet title={tenant.name} subtitle={`${unit.name} · ${unit.floor} · ${unit.type}`} onClose={onClose}>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {[["Rent", C.accent, C.accentSoft], paysWater && ["Water", C.blue, C.blueSoft], paysElec && ["Electricity", C.amber, C.amberSoft], !paysElec && ["Free current", C.green, C.greenSoft]].filter(Boolean).map(([l, color, bg]) => (
          <span key={l} style={{ background: bg, color, fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, border: `0.5px solid ${color}40` }}>{l}</span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        {[[lt.overview, "overview"], [lt.payments, "payments"], [lt.notice, "notice"]].map(([label, key]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: "9px 16px", borderRadius: 12, border: `0.5px solid ${tab === key ? C.accent : C.border}`, background: tab === key ? C.accent : C.surface, color: tab === key ? "#fff" : C.muted, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {[[lt.monthlyRent, fmt(tenant.rent), C.accent], [lt.advancePaidL, fmt(tenant.advance_amount), C.blue], ["Outstanding", fmt(outstanding), outstanding > 0 ? C.red : C.green], ["Since", tenant.joined_date, C.text]].map(([l, v, color]) => (
              <div key={l} style={{ background: C.bg, borderRadius: 12, padding: "12px 14px", border: `0.5px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{l}</div>
                <div style={{ fontSize: 14, color, fontWeight: 700 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Phone */}
          <div style={{ background: C.bg, borderRadius: 12, padding: "13px 14px", marginBottom: 12, border: `0.5px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{lt.phone}</div>
            {editingPhone ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input value={phoneVal} onChange={e => setPhoneVal(e.target.value)} placeholder="10-digit number" type="tel"
                  style={{ flex: 1, padding: "9px 12px", background: C.surface, border: `0.5px solid ${C.accent}`, borderRadius: 10, fontSize: 16, color: C.text, outline: "none", fontFamily: "inherit" }} />
                <button onClick={async () => {
                  const digits = String(phoneVal).replace(/\D/g, "")
                  const normalized = digits.length === 10 ? "91" + digits : digits
                  const { data: saved, error } = await supabase.from("tenants").update({ phone: normalized }).eq("id", tenant.id).select("phone").single()
                  const finalPhone = saved?.phone || normalized
                  if (!error) {
                    setPhoneVal(finalPhone)
                    setTenants(ts => ts.map(t => t.id === tenant.id ? { ...t, phone: finalPhone } : t))
                    tenant.phone = finalPhone
                    toast("Phone number saved")
                  } else {
                    toast("Could not save number", "error")
                  }
                  setEditingPhone(false)
                }}
                  style={{ padding: "9px 14px", background: C.accent, border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, color: "#fff", fontSize: 13, fontFamily: "inherit" }}>Save</button>
                <button onClick={() => { setPhoneVal(tenant.phone || ""); setEditingPhone(false) }} style={{ padding: "9px 12px", background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 10, cursor: "pointer", color: C.muted, fontFamily: "inherit" }}>✕</button>
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: phoneVal ? C.text : C.muted }}>{phoneVal ? `+${phoneVal}` : lt.noPhone}</div>
                <button onClick={() => setEditingPhone(true)} style={{ padding: "6px 12px", background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: C.accent, fontSize: 12, fontFamily: "inherit" }}>
                  {phoneVal ? lt.editPhone : lt.addPhone}
                </button>
              </div>
            )}
          </div>

          {/* Agreement */}
          <div style={{ background: C.bg, borderRadius: 12, padding: "13px 14px", marginBottom: 12, border: `0.5px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{lt.agreement}</div>
                {tenant.agreement_status === "Pending" && <Pill label={lt.noAgreement} color={C.red} bg={C.redSoft} border={C.redBorder} />}
                {tenant.agreement_status === "Requested" && <Pill label={lt.docsRequested} color={C.amber} bg={C.amberSoft} border={C.amberBorder} />}
                {tenant.agreement_status === "Documents Submitted" && <Pill label={lt.docsReceived} color={C.green} bg={C.greenSoft} border={C.greenBorder} />}
                {tenant.agreement_status === "Complete" && <Pill label="Complete" color={C.green} bg={C.greenSoft} border={C.greenBorder} />}
              </div>
              {tenant.agreement_status !== "Complete" && (
                <button onClick={requestAgreement} style={{ padding: "7px 12px", background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: C.accent, fontSize: 12, fontFamily: "inherit" }}>
                  {lt.requestDocs}
                </button>
              )}
            </div>

            {agreementDoc && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${C.border}` }}>
                <div style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: 500 }}>Signed agreement</div>
                <a href={agreementDoc.url} target="_blank" rel="noreferrer"
                  style={{ padding: "6px 12px", background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, borderRadius: 10, textDecoration: "none", fontSize: 12, color: C.accent, fontWeight: 600 }}>
                  View
                </a>
              </div>
            )}

            <label style={{ display: "block", marginTop: 12 }}>
              <input type="file" accept="application/pdf,image/*" disabled={uploadingAgreement}
                onChange={e => uploadAgreement(e.target.files?.[0])}
                style={{ display: "none" }} />
              <div style={{ width: "100%", padding: "11px", background: C.surface, border: `1px dashed ${C.accentBorder}`, borderRadius: 12, cursor: uploadingAgreement ? "default" : "pointer", fontWeight: 600, color: C.accent, fontSize: 13, textAlign: "center", fontFamily: "inherit", boxSizing: "border-box" }}>
                {uploadingAgreement ? "Uploading..." : agreementDoc ? "Replace agreement" : "Upload agreement (PDF or photo)"}
              </div>
            </label>
          </div>

          {/* Documents */}
          <div style={{ background: C.bg, borderRadius: 12, padding: "13px 14px", marginBottom: 12, border: `0.5px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>{lt.documents}</div>
            {tenantDocs.length === 0 ? (
              <div style={{ fontSize: 13, color: C.muted }}>{lt.noDocs}</div>
            ) : tenantDocs.map((doc, i) => {
              const label = doc.name.startsWith("aadhaar_") ? "Aadhaar Card" : doc.name.startsWith("pan_") ? "PAN Card" : "Document"
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < tenantDocs.length - 1 ? `0.5px solid ${C.border}` : "none" }}>
                  <div style={{ flex: 1, fontSize: 13, color: C.text, fontWeight: 500 }}>{label}</div>
                  <a href={doc.url} target="_blank" rel="noreferrer" download
                    style={{ padding: "6px 12px", background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, borderRadius: 10, textDecoration: "none", fontSize: 12, color: C.accent, fontWeight: 600 }}>
                    Download
                  </a>
                </div>
              )
            })}
            {tenantDocs.length > 0 && (
              <button onClick={deleteIdDocs}
                style={{ width: "100%", marginTop: 12, padding: "10px", background: C.redSoft, border: `0.5px solid ${C.redBorder}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: C.red, fontSize: 12, fontFamily: "inherit" }}>
                Delete ID documents (after verifying)
              </button>
            )}
          </div>

          <button onClick={sendPortal}
            style={{ width: "100%", padding: "14px", background: "#dcfce7", border: `0.5px solid #6ee7b7`, borderRadius: 14, cursor: "pointer", fontWeight: 600, color: "#065f46", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a6.8 6.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            {lt.sendPortal}
          </button>

          <button onClick={viewAsTenant}
            style={{ width: "100%", marginTop: 8, padding: "13px", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 14, cursor: "pointer", fontWeight: 600, color: C.accent, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
            View their portal
          </button>
        </div>
      )}

      {tab === "payments" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
            {[["Paid", payments.filter(p => p.status === "Paid").length, C.green], ["Unpaid", payments.filter(p => p.status === "Unpaid").length, C.red], ["Due", fmt(outstanding), C.amber]].map(([l, v, color]) => (
              <div key={l} style={{ background: C.bg, borderRadius: 12, padding: "11px 10px", textAlign: "center", border: `0.5px solid ${C.border}` }}>
                <div style={{ fontSize: 16, fontWeight: 700, color }}>{v}</div>
                <div style={{ fontSize: 10, color: C.muted, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.06em" }}>{l}</div>
              </div>
            ))}
          </div>

          <button onClick={addPaymentMonth} style={{ width: "100%", padding: "12px", background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, borderRadius: 12, cursor: "pointer", fontWeight: 600, color: C.accent, fontSize: 14, fontFamily: "inherit", marginBottom: 14 }}>
            {lt.addMonth}
          </button>

          {loading && <div style={{ textAlign: "center", padding: 24, color: C.muted }}>Loading...</div>}

          {[...payments].reverse().map(p => (
            <div key={p.id} style={{ background: C.bg, borderRadius: 14, border: `0.5px solid ${p.status === "Unpaid" ? C.redBorder : C.border}`, padding: 14, marginBottom: 10 }}>
              {editingPayment === p.id ? (
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 12 }}>{MONTHS[p.month - 1]} {p.year} · Add bills</div>
                  {paysWater && <Field label="Water bill (share)"><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }}>₹</span><input style={{ ...iStyle, paddingLeft: 26 }} type="number" value={billForm.water_bill} onChange={e => setBillForm(f => ({ ...f, water_bill: e.target.value }))} placeholder="0" /></div></Field>}
                  {paysElec && <Field label="Electricity bill"><div style={{ position: "relative" }}><span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }}>₹</span><input style={{ ...iStyle, paddingLeft: 26 }} type="number" value={billForm.electricity_bill} onChange={e => setBillForm(f => ({ ...f, electricity_bill: e.target.value }))} placeholder="0" /></div></Field>}
                  <Field label="Notes"><input style={iStyle} value={billForm.notes} onChange={e => setBillForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Promised to pay on 20th" /></Field>
                  <div style={{ background: C.accentSoft, borderRadius: 10, padding: "9px 12px", marginBottom: 10, fontSize: 13, color: C.accent, fontWeight: 500 }}>
                    Total: {fmt(Number(p.amount) + (Number(billForm.water_bill) || 0) + (Number(billForm.electricity_bill) || 0))}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setEditingPayment(null)} style={{ flex: 1, padding: "11px", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, cursor: "pointer", color: C.muted, fontFamily: "inherit" }}>Cancel</button>
                    <button onClick={() => updateBills(p)} style={{ flex: 2, padding: "11px", background: C.accent, border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, color: "#fff", fontFamily: "inherit" }}>Save bills</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{MONTHS[p.month - 1]} {p.year}</div>
                      {p.notes && <div style={{ fontSize: 11, color: C.amber, marginTop: 2 }}>{p.notes}</div>}
                      {p.verification_status === "Pending Verification" && <div style={{ fontSize: 11, color: C.accent, marginTop: 2 }}>Awaiting your confirmation</div>}
                    </div>
                    {p.status === "Paid" ? <Pill label={lt.paid} color={C.green} bg={C.greenSoft} border={C.greenBorder} /> : isOverdue(p.month, p.year) ? <Pill label={lt.overdue} color={C.red} bg={C.redSoft} border={C.redBorder} /> : <Pill label={lt.pending} color={C.amber} bg={C.amberSoft} border={C.amberBorder} />}
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                    <div style={{ background: C.surface, borderRadius: 8, padding: "5px 10px", border: `0.5px solid ${C.border}`, fontSize: 12 }}>Rent: {fmt(p.amount)}</div>
                    {paysWater && <div style={{ background: C.blueSoft, borderRadius: 8, padding: "5px 10px", fontSize: 12, color: C.blue }}>Water: {p.water_bill > 0 ? fmt(p.water_bill) : "–"}</div>}
                    {paysElec && <div style={{ background: C.amberSoft, borderRadius: 8, padding: "5px 10px", fontSize: 12, color: C.amber }}>Elec: {p.electricity_bill > 0 ? fmt(p.electricity_bill) : "–"}</div>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 12, color: C.muted }}>{p.status === "Paid" ? `Paid on ${fmtDate(p.paid_on)}` : `Due by ${MONTHS[p.month % 12]} 10`}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Total: {fmt(p.total_due || p.amount)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {(paysWater || paysElec) && (
                        <button onClick={() => { setEditingPayment(p.id); setBillForm({ water_bill: p.water_bill || "", electricity_bill: p.electricity_bill || "", notes: p.notes || "" }) }}
                          style={{ padding: "8px 10px", background: C.amberSoft, border: `0.5px solid ${C.amberBorder}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: C.amber, fontSize: 12, fontFamily: "inherit" }}>
                          {lt.addBills}
                        </button>
                      )}
                      <button onClick={() => togglePayment(p)}
                        style={{ padding: "8px 12px", background: p.status === "Paid" ? C.greenSoft : C.accentSoft, border: `0.5px solid ${p.status === "Paid" ? C.greenBorder : C.accentBorder}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: p.status === "Paid" ? C.green : C.accent, fontSize: 12, fontFamily: "inherit" }}>
                        {p.status === "Paid" ? lt.markUnpaid : lt.markPaid}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "notice" && (
        <div>
          {notice && notice.status !== "Cancelled" ? (
            <div>
              <div style={{ background: notice.status === "Settled" ? C.greenSoft : "#faf5ff", border: `0.5px solid ${notice.status === "Settled" ? C.greenBorder : "#c4b5fd"}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: notice.status === "Settled" ? C.green : "#7c3aed", marginBottom: 4 }}>
                  {notice.status === "Settled" ? lt.settledDone : "Notice to vacate active"}
                </div>
                <div style={{ fontSize: 13, color: C.sub }}>Move-out date: {fmtDate(notice.move_out_date)}</div>
              </div>

              {notice.status === "Active" && (
                <div>
                  <Card style={{ marginBottom: 14 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 14 }}>{lt.settlement}</div>
                    {[[lt.advancePaidL, fmt(notice.advance_amount), C.green], [lt.outstandingDues, fmt(notice.outstanding_dues), C.red]].map(([l, v, color]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `0.5px solid ${C.border}` }}>
                        <span style={{ fontSize: 14, color: C.sub }}>{l}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 12, padding: 14, background: notice.landlord_pays ? C.greenSoft : C.redSoft, borderRadius: 12, textAlign: "center", border: `0.5px solid ${notice.landlord_pays ? C.greenBorder : C.redBorder}` }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: notice.landlord_pays ? C.green : C.red }}>
                        {notice.landlord_pays ? lt.refundTo(tenant.name) : lt.owes(tenant.name)}: {fmt(notice.settlement_amount)}
                      </div>
                    </div>
                  </Card>
                  <DeductionsSection notice={notice} tenant={tenant} unit={unit} lt={lt} onClose={onClose} setTenants={setTenants} setUnits={setUnits} setActiveNotices={setActiveNotices} setNotice={setNotice} />
                  <button onClick={async () => {
                    if (!window.confirm(lt.cancelNoticeSure)) return
                    await supabase.from("notices").update({ status: "Cancelled" }).eq("id", notice.id)
                    setNotice(null)
                    setActiveNotices && setActiveNotices(ns => ns.filter(n => n.id !== notice.id))
                  }} style={{ width: "100%", padding: "12px", background: C.redSoft, border: `0.5px solid ${C.redBorder}`, borderRadius: 14, cursor: "pointer", fontWeight: 600, color: C.red, fontSize: 14, fontFamily: "inherit", marginTop: 10 }}>
                    {lt.cancelNotice}
                  </button>
                </div>
              )}
            </div>
          ) : showNoticeForm ? (
            <Card>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4 }}>{lt.recordNotice}</div>
              <div style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.6 }}>Settlement calculated from advance minus outstanding dues.</div>
              <Field label="Move-out date">
                <input type="date" style={iStyle} value={moveOutDate} onChange={e => setMoveOutDate(e.target.value)} min={new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]} />
              </Field>
              <div style={{ background: C.bg, borderRadius: 12, padding: 14, marginBottom: 14, border: `0.5px solid ${C.border}` }}>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Settlement preview:</div>
                <div style={{ fontSize: 14, color: C.sub }}>Advance: <strong style={{ color: C.green }}>{fmt(tenant.advance_amount)}</strong></div>
                <div style={{ fontSize: 14, color: C.sub }}>Outstanding: <strong style={{ color: C.red }}>{fmt(outstanding)}</strong></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: (tenant.advance_amount - outstanding) >= 0 ? C.green : C.red, marginTop: 8 }}>
                  {(tenant.advance_amount - outstanding) >= 0 ? `Refund: ${fmt(tenant.advance_amount - outstanding)}` : `Owes: ${fmt(Math.abs(tenant.advance_amount - outstanding))}`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowNoticeForm(false)} style={{ flex: 1, padding: "13px", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 12, cursor: "pointer", color: C.muted, fontFamily: "inherit" }}>Cancel</button>
                <button onClick={submitNotice} disabled={!moveOutDate} style={{ flex: 2, padding: "13px", background: moveOutDate ? C.accent : C.bg, border: "none", borderRadius: 12, cursor: moveOutDate ? "pointer" : "default", fontWeight: 700, color: moveOutDate ? "#fff" : C.muted, fontFamily: "inherit" }}>
                  {lt.confirmNotice}
                </button>
              </div>
            </Card>
          ) : (
            <div>
              <Card style={{ textAlign: "center", padding: 36, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8 }}>{lt.noNotice}</div>
                <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7 }}>{lt.noNoticeDesc(tenant.name)}</div>
              </Card>
              <button onClick={() => setShowNoticeForm(true)} style={{ width: "100%", padding: "14px", background: C.amberSoft, border: `0.5px solid ${C.amberBorder}`, borderRadius: 14, cursor: "pointer", fontWeight: 700, color: C.amber, fontSize: 15, fontFamily: "inherit" }}>
                {lt.recordNotice}
              </button>
            </div>
          )}
        </div>
      )}
    </Sheet>
  )
}

function DeductionsSection({ notice, tenant, unit, lt, onClose, setTenants, setUnits, setActiveNotices, setNotice }) {
  const [d, setD] = useState({ painting: "", damages: "", cleaning: "", other: "", otherNote: "" })
  const [settling, setSettling] = useState(false)
  const total = (Number(d.painting) || 0) + (Number(d.damages) || 0) + (Number(d.cleaning) || 0) + (Number(d.other) || 0)
  const base = Number(notice.advance_amount) - Number(notice.outstanding_dues)
  const final = base - total
  const landlordPays = final > 0

  const fields = [
    [lt.painting, lt.paintingHint, "painting"], [lt.damages, lt.damagesHint, "damages"],
    [lt.cleaning, lt.cleaningHint, "cleaning"], [lt.otherDeduction, lt.otherHint, "other"],
  ]

  const printStatement = () => {
    const rows = [["Advance held", Number(notice.advance_amount), "+"]]
    if (Number(notice.outstanding_dues) > 0) rows.push(["Outstanding rent dues", Number(notice.outstanding_dues), "−"])
    if (Number(d.painting) > 0) rows.push(["Painting", Number(d.painting), "−"])
    if (Number(d.damages) > 0) rows.push(["Damages", Number(d.damages), "−"])
    if (Number(d.cleaning) > 0) rows.push(["Cleaning", Number(d.cleaning), "−"])
    if (Number(d.other) > 0) rows.push([d.otherNote ? `Other (${d.otherNote})` : "Other", Number(d.other), "−"])
    const inr = (n) => "₹" + Number(n).toLocaleString("en-IN")
    const lines = rows.map(([l, v, sign]) => `<tr><td style="padding:8px 0;color:#4a4a6a">${l}</td><td style="padding:8px 0;text-align:right;font-weight:600;color:${sign === "+" ? "#059669" : "#dc2626"}">${sign} ${inr(v)}</td></tr>`).join("")
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Settlement-${unit.name}</title></head>
<body style="font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif;color:#1a1a2e;margin:0;padding:28px;background:#fff">
<div style="max-width:440px;margin:0 auto">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #ede9fe;padding-bottom:16px;margin-bottom:18px">
    <div><div style="font-size:20px;font-weight:800;color:#5046e5">Property Manager</div><div style="font-size:13px;color:#9090a8;margin-top:2px">Move-out Settlement Statement</div></div>
  </div>
  <table style="width:100%;font-size:14px;margin-bottom:6px">
    <tr><td style="padding:4px 0;color:#9090a8">Tenant</td><td style="padding:4px 0;text-align:right;font-weight:600">${tenant.name}</td></tr>
    <tr><td style="padding:4px 0;color:#9090a8">Unit</td><td style="padding:4px 0;text-align:right;font-weight:600">${unit.name} · ${unit.floor}</td></tr>
    <tr><td style="padding:4px 0;color:#9090a8">Notice date</td><td style="padding:4px 0;text-align:right;font-weight:600">${notice.notice_date || "-"}</td></tr>
    <tr><td style="padding:4px 0;color:#9090a8">Move-out date</td><td style="padding:4px 0;text-align:right;font-weight:600">${notice.move_out_date || "-"}</td></tr>
  </table>
  <div style="border-top:1px solid #e8e8f0;margin:14px 0"></div>
  <table style="width:100%;font-size:14px">${lines}
    <tr><td style="padding:12px 0 0;font-weight:800;font-size:16px;border-top:2px solid #1a1a2e">${landlordPays ? "Refund to tenant" : "Tenant owes"}</td><td style="padding:12px 0 0;text-align:right;font-weight:800;font-size:16px;border-top:2px solid #1a1a2e;color:${landlordPays ? "#059669" : "#dc2626"}">${inr(Math.abs(final))}</td></tr>
  </table>
  <div style="font-size:12px;color:#9090a8;margin-top:24px;line-height:1.6">Computer-generated move-out settlement. Advance held minus any outstanding dues and agreed deductions.</div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},350)}</script>
</body></html>`
    const w = window.open("", "_blank")
    if (!w) { toast("Allow pop-ups to save the statement", "error"); return }
    w.document.write(html); w.document.close()
  }

  return (
    <div>
      <div style={{ background: C.amberSoft, border: `0.5px solid ${C.amberBorder}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: C.amber, marginBottom: 4 }}>{lt.deductions}</div>
        <div style={{ fontSize: 12, color: "#92400e", marginBottom: 14, lineHeight: 1.6 }}>{lt.deductionsDesc}</div>
        {fields.map(([label, hint, key]) => (
          <div key={key} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{label}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{hint}</span>
            </div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: 13 }}>₹</span>
              <input type="number" value={d[key]} onChange={e => setD(p => ({ ...p, [key]: e.target.value }))} placeholder="0"
                style={{ ...iStyle, paddingLeft: 26, background: C.surface }} />
            </div>
          </div>
        ))}
      </div>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 12 }}>{lt.finalSettlement}</div>
        {[[lt.advancePaidL, fmt(notice.advance_amount), C.green], [lt.outstandingDues, `- ${fmt(notice.outstanding_dues)}`, C.red], ...(total > 0 ? [["Deductions", `- ${fmt(total)}`, C.amber]] : [])].map(([l, v, color]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `0.5px solid ${C.border}` }}>
            <span style={{ fontSize: 13, color: C.sub }}>{l}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color }}>{v}</span>
          </div>
        ))}
        <div style={{ marginTop: 12, padding: 14, background: landlordPays ? C.greenSoft : C.redSoft, borderRadius: 12, textAlign: "center", border: `0.5px solid ${landlordPays ? C.greenBorder : C.redBorder}` }}>
          <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>{landlordPays ? lt.refundTo(tenant.name) : lt.owes(tenant.name)}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: landlordPays ? C.green : C.red }}>{fmt(Math.abs(final))}</div>
        </div>
      </Card>

      <button onClick={async () => {
        if (!window.confirm(`Confirm settlement and vacate Unit ${unit.name}?`)) return
        setSettling(true)
        await supabase.from("notices").update({ status: "Settled", deductions_total: total, final_settlement: Math.abs(final), landlord_pays_final: landlordPays }).eq("id", notice.id)
        await supabase.from("units").update({ status: "Vacant" }).eq("id", unit.id)
        await supabase.from("tenants").update({ status: "Inactive", payment_status: "Paid" }).eq("id", tenant.id)
        setUnits && setUnits(us => us.map(u => u.id === unit.id ? { ...u, status: "Vacant" } : u))
        setTenants(ts => ts.map(t => t.id === tenant.id ? { ...t, status: "Inactive" } : t))
        setActiveNotices && setActiveNotices(ns => ns.filter(n => n.id !== notice.id))
        setSettling(false)
        toast("Settled, unit marked vacant")
        logAudit(`Settled move-out for ${tenant.name} (${unit.name})`)
        onClose()
      }} disabled={settling}
        style={{ width: "100%", padding: "14px", background: settling ? C.bg : C.green, border: "none", borderRadius: 14, cursor: settling ? "default" : "pointer", fontWeight: 700, color: settling ? C.muted : "#fff", fontSize: 14, fontFamily: "inherit" }}>
        {settling ? "Processing..." : lt.settleAndVacate}
      </button>
      <button onClick={printStatement}
        style={{ width: "100%", marginTop: 8, padding: "12px", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 14, cursor: "pointer", fontWeight: 600, color: C.accent, fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Settlement statement (print / save)
      </button>
    </div>
  )
}

// ── BILLS TAB ──────────────────────────────────────────────────────────────────
function BillsTab({ tenants, units }) {
  const lt = useLT()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [waterTotal, setWaterTotal] = useState("")
  const [elecBills, setElecBills] = useState({ 1: "", 2: "" })
  const [lastMonth, setLastMonth] = useState({ water: 0, elec1: 0, elec2: 0 })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load current month bills
    supabase.from("monthly_bills").select("*").eq("month", month).eq("year", year).maybeSingle().then(({ data }) => {
      if (data) { setWaterTotal(data.water_bill_total || ""); setElecBills({ 1: data.eb_francis || "", 2: data.eb_vital || "" }) }
      else { setWaterTotal(""); setElecBills({ 1: "", 2: "" }) }
    })
    // Load last month for hints
    const lastM = month === 1 ? 12 : month - 1
    const lastY = month === 1 ? year - 1 : year
    supabase.from("monthly_bills").select("*").eq("month", lastM).eq("year", lastY).maybeSingle().then(({ data }) => {
      if (data) setLastMonth({ water: data.water_bill_total || 0, elec1: data.eb_francis || 0, elec2: data.eb_vital || 0 })
    })
  }, [month, year])

  const waterShare = waterTotal ? Math.round(Number(waterTotal) / WATER_SHARES) : 0

  const saveBills = async () => {
    setSaving(true)
    const share = Math.round(Number(waterTotal) / WATER_SHARES)
    const existing = await supabase.from("monthly_bills").select("id").eq("month", month).eq("year", year).maybeSingle()
    const billData = { month, year, water_bill_total: Number(waterTotal), water_share: share, eb_francis: Number(elecBills[1]) || 0, eb_vital: Number(elecBills[2]) || 0 }
    if (existing.data) await supabase.from("monthly_bills").update(billData).eq("id", existing.data.id)
    else await supabase.from("monthly_bills").insert([billData])

    for (const unitId of WATER_UNIT_IDS) {
      const tenant = tenants.find(t => t.unit_id === unitId && t.status === "Active")
      if (!tenant) continue
      const { data: pr } = await supabase.from("payment_records").select("*").eq("tenant_id", tenant.id).eq("month", month).eq("year", year).maybeSingle()
      if (pr) {
        const elec = ELEC_TENANT_IDS.includes(tenant.id) ? (Number(elecBills[tenant.id]) || 0) : 0
        await supabase.from("payment_records").update({ water_bill: share, electricity_bill: elec, total_due: Number(pr.amount) + share + elec }).eq("id", pr.id)
      }
    }
    setSaving(false); setSaved(true)
    toast("Bills saved for all units")
    logAudit(`Saved ${MONTH_NAMES[month - 1]} ${year} bills`)
    setTimeout(() => setSaved(false), 3000)
  }

  const francisG1 = tenants.find(t => t.unit_id === 1 && t.status === "Active")
  const vitalS1 = tenants.find(t => t.unit_id === 2 && t.status === "Active")

  return (
    <div>
      {saved && (
        <div style={{ background: C.greenSoft, border: `0.5px solid ${C.greenBorder}`, borderRadius: 14, padding: "12px 16px", marginBottom: 14, fontSize: 14, color: C.green, fontWeight: 600 }}>
          {lt.billsSaved}
        </div>
      )}

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 14 }}>Select month</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Month">
            <select style={{ ...iStyle, appearance: "none" }} value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </Field>
          <Field label="Year">
            <select style={{ ...iStyle, appearance: "none" }} value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 4 }}>{lt.waterBill}</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>{lt.waterDesc}{lastMonth.water > 0 ? ` · Last month: ${fmt(lastMonth.water)}` : ""}</div>
        <div style={{ position: "relative", marginBottom: 12 }}>
          <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted }}>₹</span>
          <input style={{ ...iStyle, paddingLeft: 28 }} type="number" value={waterTotal} onChange={e => setWaterTotal(e.target.value)} placeholder={lastMonth.water ? String(lastMonth.water) : "e.g. 7000"} />
        </div>
        {waterTotal > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["G1 · Francis", "S1 · Vital", "T1 · Francis", "T2 · Srinivas", "Your home"].map((l, i) => (
              <div key={i} style={{ background: C.blueSoft, borderRadius: 8, padding: "5px 10px", fontSize: 12, color: C.blue }}>{l}: {fmt(waterShare)}</div>
            ))}
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 4 }}>{lt.electricityBills}</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>{lt.electricityDesc}</div>
        {francisG1 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>Francis · G1{lastMonth.elec1 > 0 ? ` · Last month: ${fmt(lastMonth.elec1)}` : ""}</div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted }}>₹</span>
              <input style={{ ...iStyle, paddingLeft: 28 }} type="number" value={elecBills[1]} onChange={e => setElecBills(f => ({ ...f, 1: e.target.value }))} placeholder={lastMonth.elec1 ? String(lastMonth.elec1) : "e.g. 850"} />
            </div>
          </div>
        )}
        {vitalS1 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>Vital · S1{lastMonth.elec2 > 0 ? ` · Last month: ${fmt(lastMonth.elec2)}` : ""}</div>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.muted }}>₹</span>
              <input style={{ ...iStyle, paddingLeft: 28 }} type="number" value={elecBills[2]} onChange={e => setElecBills(f => ({ ...f, 2: e.target.value }))} placeholder={lastMonth.elec2 ? String(lastMonth.elec2) : "e.g. 620"} />
            </div>
          </div>
        )}
        <div style={{ background: C.greenSoft, borderRadius: 12, padding: "12px 14px", border: `0.5px solid ${C.greenBorder}` }}>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 6 }}>{lt.freeElec}</div>
          {["T1 · Francis", "T2 · Srinivas", "R1 · Yogee", "R2 · Sowmya"].map(l => (
            <div key={l} style={{ fontSize: 13, color: C.green, fontWeight: 500, marginBottom: 2 }}>✓ {l}</div>
          ))}
        </div>
      </Card>

      {waterTotal > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 12 }}>{lt.totalDueMonth}</div>
          {tenants.filter(t => t.status === "Active").map(t => {
            const u = units.find(u => u.id === t.unit_id)
            const water = WATER_UNIT_IDS.includes(t.unit_id) ? waterShare : 0
            const elec = ELEC_TENANT_IDS.includes(t.id) ? (Number(elecBills[t.id]) || 0) : 0
            const total = Number(t.rent) + water + elec
            return (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `0.5px solid ${C.border}` }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14, color: C.text }}>{t.name} · {u?.name}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{fmt(t.rent)}{water > 0 ? ` + ${fmt(water)} water` : ""}{elec > 0 ? ` + ${fmt(elec)} elec` : ""}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.accent }}>{fmt(total)}</div>
              </div>
            )
          })}
        </Card>
      )}

      <button onClick={saveBills} disabled={saving || !waterTotal}
        style={{ width: "100%", padding: "15px", background: (!waterTotal || saving) ? C.bg : C.accent, border: "none", borderRadius: 14, cursor: (!waterTotal || saving) ? "default" : "pointer", fontWeight: 700, color: (!waterTotal || saving) ? C.muted : "#fff", fontSize: 15, fontFamily: "inherit" }}>
        {saving ? lt.saving : lt.saveBillsBtn(MONTH_NAMES[month - 1], year)}
      </button>
    </div>
  )
}

// ── BROADCAST TAB ──────────────────────────────────────────────────────────────
function BroadcastTab({ tenants, units, setTenants }) {
  const lt = useLT()
  const [selected, setSelected] = useState([])
  const [activeTemplate, setActiveTemplate] = useState(null)
  const [customMsg, setCustomMsg] = useState("")
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, name: "" })
  const [doneCount, setDoneCount] = useState(0)
  const [showDone, setShowDone] = useState(false)

  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const getUnit = (unitId) => units.find(u => u.id === unitId)

  // Normalize phone: strip non-digits, ensure starts with 91
  const normalizePhone = (raw) => {
    if (!raw) return null
    const digits = String(raw).replace(/\D/g, "")
    if (digits.startsWith("91") && digits.length >= 12) return digits
    if (digits.length === 10) return "91" + digits
    return digits
  }

  const TEMPLATES = [
    { id: "portal", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2" strokeLinecap="round"/></svg>, label: "Send portal link", color: C.accent, bg: C.accentSoft, desc: "Send each tenant their personal portal link.", getMessage: (t) => { const link = `${window.location.origin}/tenant/${t.portal_token}`; return `Hi ${t.name}! 👋\n\nWe have set up a new *Property Manager* app for our building.\n\nYour personal portal:\n${link}\n\nYou can use it to:\n✅ View and pay rent\n📄 Upload documents\n🔧 Report issues\n📋 Give notice\n\nOpen in Safari/Chrome and tap "Add to Home Screen" to install. 🏠` } },
    { id: "agreement", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, label: "Request agreement documents", color: C.amber, bg: C.amberSoft, desc: "Ask tenants to upload Aadhaar and PAN card.", getMessage: (t) => { const link = `${window.location.origin}/tenant/${t.portal_token}`; return `Hi ${t.name}, we are updating rental agreements for all tenants.\n\nPlease upload your *Aadhaar* and *PAN card* through your portal:\n${link}\n\nTap Documents tab → upload each file separately.\n\nThank you!` } },
    { id: "rent", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>, label: "Rent payment reminder", color: C.green, bg: C.greenSoft, desc: "Remind tenants rent is due. Includes their portal link.", getMessage: (t, u) => { const link = `${window.location.origin}/tenant/${t.portal_token}`; return `Hi ${t.name} 👋\n\nFriendly reminder that your rent of *${fmt(t.rent)}* for Unit ${u?.name} is due by the *10th of this month*.\n\nPay directly through your portal:\n${link}\n\nTap the Pay button to use GPay, PhonePe, or Paytm.\n\nThank you!` } },
    { id: "maintenance", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>, label: "Maintenance notice", color: C.blue, bg: C.blueSoft, desc: "Inform tenants about upcoming maintenance work.", getMessage: (t) => `Hi ${t.name},\n\nPlease note that there will be maintenance work in the building soon. We will keep you updated on timing.\n\nSorry for any inconvenience. Thank you! 🙏` },
    { id: "water", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>, label: "Water supply notice", color: C.blue, bg: C.blueSoft, desc: "Notify tenants of water supply interruption.", getMessage: (t) => `Hi ${t.name},\n\nPlease be informed that there will be a water supply interruption in the building. Please store water in advance.\n\nWe will notify once supply is restored. Thank you! 🙏` },
    { id: "welcome", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label: "Welcome message", color: "#7c3aed", bg: "#f5f3ff", desc: "Welcome new or all tenants.", getMessage: (t) => `Hi ${t.name}! 🎉\n\nWelcome to our building community. We are always here if you need anything.\n\nFeel free to reach out for any concerns. We hope you have a comfortable stay! 🏠` },
    { id: "custom", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>, label: "Custom message", color: C.text, bg: C.bg, desc: "Write your own message.", getMessage: () => customMsg },
  ]

  const sendMessages = async () => {
    if (!selected.length || !activeTemplate) return
    const template = TEMPLATES.find(t => t.id === activeTemplate)
    if (!template) return
    if (activeTemplate === "custom" && !customMsg.trim()) { alert("Please write a message first."); return }

    const toSend = selected.map(id => tenants.find(x => x.id === id)).filter(Boolean)
    setSending(true)
    setProgress({ current: 0, total: toSend.length, name: "" })

    for (let i = 0; i < toSend.length; i++) {
      const t = toSend[i]
      const u = getUnit(t.unit_id)
      const phone = normalizePhone(t.phone)
      setProgress({ current: i + 1, total: toSend.length, name: t.name })

      if (phone) {
        const msg = encodeURIComponent(template.getMessage(t, u))
        window.open(`https://wa.me/${phone}?text=${msg}`, "_blank")
      }

      if (activeTemplate === "agreement") {
        await supabase.from("tenants").update({ agreement_status: "Requested" }).eq("id", t.id)
        setTenants(ts => ts.map(x => x.id === t.id ? { ...x, agreement_status: "Requested" } : x))
      }
      if (activeTemplate === "rent") {
        const newR = { sentAt: nowStr(), message: template.getMessage(t, u) }
        const updated = [...(t.reminders || []), newR]
        await supabase.from("tenants").update({ reminders: updated }).eq("id", t.id)
        setTenants(ts => ts.map(x => x.id === t.id ? { ...x, reminders: updated } : x))
      }

      // Small delay so browser doesn't block multiple popups
      if (i < toSend.length - 1) await new Promise(r => setTimeout(r, 800))
    }

    setDoneCount(toSend.length)
    setSending(false)
    setShowDone(true)
    setSelected([])
    setTimeout(() => setShowDone(false), 4000)
  }

  const selectedTemplate = TEMPLATES.find(t => t.id === activeTemplate)
  const activeTenants = tenants.filter(t => t.status === "Active")

  const lastSentLabel = (t) => {
    const reminders = t.reminders || []
    if (reminders.length === 0) return null
    return reminders[reminders.length - 1].sentAt
  }

  return (
    <div>
      {/* Done banner */}
      <div style={{ overflow: "hidden", maxHeight: showDone ? 60 : 0, transition: "max-height 0.35s ease", marginBottom: showDone ? 14 : 0 }}>
        <div style={{ background: C.greenSoft, border: `0.5px solid ${C.greenBorder}`, borderRadius: 14, padding: "12px 16px", fontSize: 14, color: C.green, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Sent to {doneCount} tenant{doneCount !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Sending progress overlay */}
      {sending && (
        <div style={{ background: C.surface, border: `0.5px solid ${C.accentBorder}`, borderRadius: 16, padding: "18px 20px", marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 10 }}>
            Opening WhatsApp for {progress.name}...
          </div>
          <div style={{ height: 6, background: C.bg, borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: 6, background: C.accent, borderRadius: 3, width: `${(progress.current / progress.total) * 100}%`, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>{progress.current} of {progress.total}</div>
        </div>
      )}

      {/* Template grid */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>{lt.chooseTemplate}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {TEMPLATES.map(tmpl => (
            <button key={tmpl.id} onClick={() => setActiveTemplate(activeTemplate === tmpl.id ? null : tmpl.id)}
              style={{ padding: "12px", borderRadius: 12, border: `0.5px solid ${activeTemplate === tmpl.id ? tmpl.color : C.border}`, background: activeTemplate === tmpl.id ? tmpl.bg : C.surface, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.15s ease" }}>
              <div style={{ color: activeTemplate === tmpl.id ? tmpl.color : C.muted, marginBottom: 6, display: "flex" }}>{tmpl.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 12, color: activeTemplate === tmpl.id ? tmpl.color : C.text, lineHeight: 1.3 }}>{tmpl.label}</div>
            </button>
          ))}
        </div>
        {selectedTemplate && (
          <div style={{ marginTop: 12, padding: "11px 13px", background: C.bg, borderRadius: 10, border: `0.5px solid ${C.border}`, fontSize: 12, color: C.muted, transition: "all 0.2s ease" }}>
            {selectedTemplate.desc}
            {activeTemplate === "custom" && (
              <textarea value={customMsg} onChange={e => setCustomMsg(e.target.value)} rows={3} placeholder="Type your message here..."
                style={{ width: "100%", marginTop: 8, padding: "10px", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, fontSize: 16, color: C.text, outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.5, boxSizing: "border-box" }} />
            )}
          </div>
        )}
      </Card>

      {/* Recipients */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}>{lt.recipients}</div>
        <button onClick={() => setSelected(selected.length === activeTenants.length ? [] : activeTenants.map(t => t.id))}
          style={{ background: "none", border: "none", color: C.accent, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
          {selected.length === activeTenants.length ? lt.clearAll : lt.selectAll}
        </button>
      </div>

      {activeTenants.map(t => {
        const u = getUnit(t.unit_id)
        const sel = selected.includes(t.id)
        const phone = normalizePhone(t.phone)
        const lastSent = lastSentLabel(t)
        return (
          <div key={t.id} onClick={() => toggle(t.id)}
            style={{ background: sel ? C.accentSoft : C.surface, border: `0.5px solid ${sel ? C.accentBorder : C.border}`, borderRadius: 14, padding: "13px 14px", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "background 0.15s ease, border-color 0.15s ease" }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, border: `1.5px solid ${sel ? C.accent : C.border}`, background: sel ? C.accent : C.surface, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s ease" }}>
              {sel && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{t.name}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{u?.name} · {u?.floor}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "flex-end", flexShrink: 0 }}>
              {phone
                ? lastSent
                  ? <div style={{ fontSize: 10, color: C.muted }}>Sent {lastSent}</div>
                  : <div style={{ fontSize: 10, color: C.green, fontWeight: 500 }}>Ready</div>
                : <div style={{ fontSize: 10, color: C.red, fontWeight: 500 }}>No number</div>
              }
            </div>
          </div>
        )
      })}

      {/* Send button */}
      <div style={{ position: "sticky", bottom: 16, marginTop: 12 }}>
        <button onClick={activeTemplate && !sending ? sendMessages : undefined} disabled={sending}
          style={{ width: "100%", padding: "16px", background: sending ? C.bg : activeTemplate && selected.length > 0 ? (selectedTemplate?.color || C.accent) : C.bg, border: "none", borderRadius: 16, cursor: activeTemplate && selected.length > 0 && !sending ? "pointer" : "default", fontWeight: 700, color: sending ? C.muted : activeTemplate && selected.length > 0 ? "#fff" : C.muted, fontSize: 15, fontFamily: "inherit", transition: "background 0.2s ease, color 0.2s ease" }}>
          {sending ? `Sending ${progress.current} of ${progress.total}...` : selected.length > 0 ? activeTemplate ? lt.sendTo(selected.length) : lt.chooseFirst : "Select recipients above"}
        </button>
      </div>
    </div>
  )
}

// ── MAINTENANCE TAB ────────────────────────────────────────────────────────────
function MaintenanceTab() {
  const lt = useLT()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("All")

  useEffect(() => {
    supabase.from("maintenance_requests").select("*").order("id", { ascending: false }).then(({ data }) => { if (data) setRequests(data); setLoading(false) })
  }, [])

  const updateStatus = async (id, status) => {
    await supabase.from("maintenance_requests").update({ status }).eq("id", id)
    setRequests(rs => rs.map(r => r.id === id ? { ...r, status } : r))
  }

  const counts = { Open: requests.filter(r => r.status === "Open").length, "In Progress": requests.filter(r => r.status === "In Progress").length, Resolved: requests.filter(r => r.status === "Resolved").length }
  const filtered = filter === "All" ? requests : requests.filter(r => r.status === filter)

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
        {[["Open", C.red, C.redSoft, C.redBorder], [lt.inProgress, C.amber, C.amberSoft, C.amberBorder], [lt.resolved, C.green, C.greenSoft, C.greenBorder]].map(([s, color, bg, border]) => (
          <div key={s} onClick={() => setFilter(filter === s ? "All" : s)} style={{ background: filter === s ? bg : C.surface, borderRadius: 14, padding: "12px 10px", border: `0.5px solid ${filter === s ? border : C.border}`, textAlign: "center", cursor: "pointer" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{counts[s.replace(lt.inProgress, "In Progress").replace(lt.resolved, "Resolved")] ?? counts[s] ?? 0}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{s}</div>
          </div>
        ))}
      </div>

      {loading ? <div style={{ textAlign: "center", padding: 32, color: C.muted }}>Loading...</div> :
        filtered.length === 0 ? (
          <Card style={{ textAlign: "center", padding: 44 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8 }}>{lt.noIssues}</div>
            <div style={{ color: C.muted, fontSize: 13 }}>{lt.noIssuesSub}</div>
          </Card>
        ) : filtered.map(r => {
          const color = r.status === "Open" ? C.red : r.status === "In Progress" ? C.amber : C.green
          const bg = r.status === "Open" ? C.redSoft : r.status === "In Progress" ? C.amberSoft : C.greenSoft
          const border = r.status === "Open" ? C.redBorder : r.status === "In Progress" ? C.amberBorder : C.greenBorder
          return (
            <Card key={r.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{r.tenant_name}</div>
                  <div style={{ fontSize: 12, color: C.muted }}>{r.unit_name} · {fmtDate(r.submitted_at)}</div>
                </div>
                <Pill label={r.status} color={color} bg={bg} border={border} />
              </div>
              <p style={{ fontSize: 14, color: C.sub, margin: "0 0 12px", lineHeight: 1.7 }}>{r.description}</p>
              {r.photo_url && <img src={r.photo_url} alt="issue" style={{ width: "100%", borderRadius: 12, marginBottom: 12, maxHeight: 180, objectFit: "cover" }} />}
              {r.status !== "Resolved" && (
                <div style={{ display: "flex", gap: 8 }}>
                  {r.status === "Open" && <button onClick={() => updateStatus(r.id, "In Progress")} style={{ flex: 1, padding: "11px", background: C.amberSoft, border: `0.5px solid ${C.amberBorder}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: C.amber, fontSize: 13, fontFamily: "inherit" }}>{lt.inProgress}</button>}
                  <button onClick={() => updateStatus(r.id, "Resolved")} style={{ flex: 1, padding: "11px", background: C.greenSoft, border: `0.5px solid ${C.greenBorder}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: C.green, fontSize: 13, fontFamily: "inherit" }}>{lt.resolved}</button>
                </div>
              )}
            </Card>
          )
        })}
    </div>
  )
}

// ── ANALYTICS TAB ──────────────────────────────────────────────────────────────
const EXP_CATEGORIES = ["Repairs", "Utilities", "Taxes", "Cleaning", "Other"]

function AnalyticsTab({ tenants, units, payments }) {
  const lt = useLT()
  const [monthDetail, setMonthDetail] = useState(null)   // { month, collected, outstanding, rows }
  const [tenantDetail, setTenantDetail] = useState(null) // { tenant, unit, payments, score }
  const [expenses, setExpenses] = useState([])
  const [showExpForm, setShowExpForm] = useState(false)
  const [expForm, setExpForm] = useState({ category: "Repairs", amount: "", note: "", date: new Date().toISOString().split("T")[0] })
  const [activity, setActivity] = useState([])

  useEffect(() => {
    supabase.from("expenses").select("*").order("expense_date", { ascending: false }).then(({ data }) => { if (data) setExpenses(data) })
    supabase.from("audit_log").select("*").order("id", { ascending: false }).limit(30).then(({ data }) => { if (data) setActivity(data) })
  }, [])

  const thisYear = new Date().getFullYear()
  const yearCollected = payments.filter(p => p.year === thisYear && p.status === "Paid").reduce((s, p) => s + Number(p.total_due || p.amount), 0)
  const yearExpenses = expenses.filter(e => new Date(e.expense_date).getFullYear() === thisYear).reduce((s, e) => s + Number(e.amount), 0)
  const netProfit = yearCollected - yearExpenses

  const addExpense = async () => {
    const amt = Number(expForm.amount)
    if (!amt || amt <= 0) { toast("Enter a valid amount", "error"); return }
    const { data } = await supabase.from("expenses").insert([{ category: expForm.category, amount: amt, note: expForm.note || null, expense_date: expForm.date }]).select().single()
    if (data) { setExpenses(es => [data, ...es]); setShowExpForm(false); setExpForm({ category: "Repairs", amount: "", note: "", date: new Date().toISOString().split("T")[0] }); toast("Expense added"); logAudit(`Added expense: ${expForm.category} ${fmt(amt)}`) }
    else toast("Could not add expense", "error")
  }

  const deleteExpense = async (id) => {
    if (!window.confirm("Remove this expense?")) return
    await supabase.from("expenses").delete().eq("id", id)
    setExpenses(es => es.filter(e => e.id !== id))
    toast("Expense removed", "info")
  }

  const totalRent = tenants.filter(t => t.status === "Active").reduce((s, t) => s + Number(t.rent), 0)
  const totalAdvance = tenants.filter(t => t.status === "Active").reduce((s, t) => s + Number(t.advance_amount), 0)
  const paidCount = tenants.filter(t => t.payment_status === "Paid").length
  const activeTenants = tenants.filter(t => t.status === "Active")
  const collectionRate = activeTenants.length > 0 ? Math.round((paidCount / activeTenants.length) * 100) : 0
  const outstandingTotal = payments.filter(p => p.status === "Unpaid").reduce((s, p) => s + Number(p.total_due || p.amount), 0)

  const monthlyData = [1, 2, 3, 4, 5].map(m => {
    const mPayments = payments.filter(p => p.month === m && p.year === 2026)
    const collected = mPayments.filter(p => p.status === "Paid").reduce((s, p) => s + Number(p.total_due || p.amount), 0)
    const outstanding = mPayments.filter(p => p.status === "Unpaid").reduce((s, p) => s + Number(p.total_due || p.amount), 0)
    return { month: MONTHS[m - 1], monthNum: m, collected, outstanding, rows: mPayments }
  })

  const maxVal = Math.max(...monthlyData.map(d => d.collected + d.outstanding), 1)

  const openMonthDetail = (d) => {
    const rows = d.rows.map(p => {
      const t = tenants.find(x => x.id === p.tenant_id)
      const u = units.find(x => x.id === p.unit_id)
      return { ...p, tenantName: t?.name || "—", unitName: u?.name || "—" }
    })
    setMonthDetail({ ...d, rows })
  }

  const openTenantDetail = (t) => {
    const u = units.find(x => x.id === t.unit_id)
    const tp = payments.filter(p => p.tenant_id === t.id).sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)
    const paid = tp.filter(p => p.status === "Paid").length
    const score = tp.length > 0 ? Math.round((paid / tp.length) * 100) : 0
    setTenantDetail({ tenant: t, unit: u, payments: tp, score })
  }

  return (
    <div>
      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[
          [lt.monthlyRent, fmt(totalRent), C.accent],
          [lt.outstanding, fmt(outstandingTotal), outstandingTotal > 0 ? C.red : C.green],
          [lt.collectionRate, `${collectionRate}%`, collectionRate >= 80 ? C.green : C.amber],
          [lt.advanceHeld, fmt(totalAdvance), C.blue],
        ].map(([l, v, color]) => (
          <div key={l} style={{ background: C.surface, borderRadius: 14, border: `0.5px solid ${C.border}`, padding: 14 }}>
            <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{l}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color, letterSpacing: "-0.3px" }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart — bars are tappable */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 4 }}>{lt.revenue}</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>2026 · Tap a month for details</div>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 80 }}>
          {monthlyData.map((d, i) => (
            <div key={i} onClick={() => openMonthDetail(d)}
              style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, cursor: "pointer" }}>
              {d.outstanding > 0 && <div style={{ background: C.redSoft, border: `0.5px solid ${C.redBorder}`, borderRadius: "3px 3px 0 0", height: `${Math.round((d.outstanding / maxVal) * 60)}px`, transition: "opacity 0.15s" }} />}
              {d.collected > 0 && <div style={{ background: C.accent, borderRadius: d.outstanding > 0 ? 0 : "3px 3px 0 0", height: `${Math.round((d.collected / maxVal) * 60)}px` }} />}
              <div style={{ fontSize: 10, color: C.muted, textAlign: "center", marginTop: 4 }}>{d.month}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 12 }}>
          {[["Collected", C.accent, false], ["Outstanding", C.redSoft, true]].map(([l, bg, bordered]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: C.muted }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: bg, border: bordered ? `0.5px solid ${C.redBorder}` : "none" }} />{l}
            </div>
          ))}
        </div>
      </Card>

      {/* Profit / Expenses */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>Profit · {thisYear}</div>
          <button onClick={() => setShowExpForm(s => !s)}
            style={{ padding: "7px 12px", background: showExpForm ? C.bg : C.accentSoft, border: `0.5px solid ${showExpForm ? C.border : C.accentBorder}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: showExpForm ? C.muted : C.accent, fontSize: 12, fontFamily: "inherit" }}>
            {showExpForm ? "Cancel" : "+ Add expense"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: showExpForm || expenses.length ? 14 : 0 }}>
          {[["Income", fmt(yearCollected), C.green], ["Expenses", fmt(yearExpenses), C.red], ["Net", fmt(netProfit), netProfit >= 0 ? C.accent : C.red]].map(([l, v, color]) => (
            <div key={l} style={{ background: C.bg, borderRadius: 10, padding: "10px 8px", border: `0.5px solid ${C.border}` }}>
              <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{l}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color, letterSpacing: "-0.3px" }}>{v}</div>
            </div>
          ))}
        </div>

        {showExpForm && (
          <div style={{ background: C.bg, borderRadius: 12, padding: 14, marginBottom: 14, border: `0.5px solid ${C.border}` }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {EXP_CATEGORIES.map(c => (
                <button key={c} onClick={() => setExpForm(f => ({ ...f, category: c }))}
                  style={{ padding: "7px 12px", background: expForm.category === c ? C.accent : C.surface, border: `0.5px solid ${expForm.category === c ? C.accent : C.border}`, borderRadius: 20, cursor: "pointer", fontWeight: 600, color: expForm.category === c ? "#fff" : C.sub, fontSize: 12, fontFamily: "inherit" }}>
                  {c}
                </button>
              ))}
            </div>
            <input type="number" inputMode="numeric" placeholder="Amount" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))}
              style={{ width: "100%", padding: "11px 12px", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, fontSize: 16, color: C.text, outline: "none", fontFamily: "inherit", marginBottom: 8, boxSizing: "border-box" }} />
            <input type="text" placeholder="Note (optional)" value={expForm.note} onChange={e => setExpForm(f => ({ ...f, note: e.target.value }))}
              style={{ width: "100%", padding: "11px 12px", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", fontFamily: "inherit", marginBottom: 8, boxSizing: "border-box" }} />
            <input type="date" value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))}
              style={{ width: "100%", padding: "11px 12px", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, fontSize: 14, color: C.text, outline: "none", fontFamily: "inherit", marginBottom: 10, boxSizing: "border-box" }} />
            <button onClick={addExpense}
              style={{ width: "100%", padding: "12px", background: C.accent, border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, color: "#fff", fontSize: 14, fontFamily: "inherit" }}>
              Save expense
            </button>
          </div>
        )}

        {expenses.slice(0, 8).map(e => (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderTop: `0.5px solid ${C.border}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{e.category}{e.note ? <span style={{ color: C.muted, fontWeight: 400 }}> · {e.note}</span> : ""}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{e.expense_date}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.red }}>−{fmt(e.amount)}</div>
            <button onClick={() => deleteExpense(e.id)} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", padding: 4, fontSize: 16, lineHeight: 1, fontFamily: "inherit" }}>×</button>
          </div>
        ))}
      </Card>

      {/* Tenant health — rows are tappable */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 4 }}>{lt.tenantHealth}</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>Tap a tenant for payment history</div>
        {activeTenants.map(t => {
          const u = units.find(u => u.id === t.unit_id)
          const tp = payments.filter(p => p.tenant_id === t.id)
          const paidMonths = tp.filter(p => p.status === "Paid").length
          const score = tp.length > 0 ? Math.round((paidMonths / tp.length) * 100) : 0
          const color = score >= 80 ? C.green : score >= 50 ? C.amber : C.red
          return (
            <div key={t.id} onClick={() => openTenantDetail(t)}
              style={{ marginBottom: 14, cursor: "pointer", padding: "8px 10px", borderRadius: 10, background: C.bg, border: `0.5px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{t.name}</span>
                  <span style={{ fontSize: 12, color: C.muted }}> · {u?.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color }}>{score}%</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>
              <div style={{ height: 4, background: C.border, borderRadius: 2 }}>
                <div style={{ height: 4, width: `${score}%`, background: color, borderRadius: 2, transition: "width 0.3s" }} />
              </div>
            </div>
          )
        })}
      </Card>

      {/* Building overview */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 14 }}>{lt.buildingOverview}</div>
        {[
          ["Total units", units.length, C.accent],
          ["Occupied", units.filter(u => u.status === "Occupied").length, C.green],
          ["Vacant", units.filter(u => u.status !== "Occupied").length, C.amber],
          ["Tenants", activeTenants.length, C.blue],
        ].map(([l, v, color]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `0.5px solid ${C.border}` }}>
            <span style={{ fontSize: 13, color: C.sub }}>{l}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color }}>{v}</span>
          </div>
        ))}
      </Card>

      {/* Activity log */}
      {activity.length > 0 && (
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 4 }}>Activity log</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>Who did what</div>
          {activity.map(a => (
            <div key={a.id} style={{ display: "flex", gap: 10, padding: "9px 0", borderTop: `0.5px solid ${C.border}` }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: C.accent, flexShrink: 0 }}>
                {(a.actor_name || "?").charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.text }}><span style={{ fontWeight: 600 }}>{a.actor_name}</span> {a.action}</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{a.created_at ? new Date(a.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Month drill-down sheet */}
      {monthDetail && (
        <Sheet title={`${monthDetail.month} 2026`} subtitle={`${fmt(monthDetail.collected)} collected · ${fmt(monthDetail.outstanding)} outstanding`} onClose={() => setMonthDetail(null)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
            {[["Collected", fmt(monthDetail.collected), C.green], ["Outstanding", fmt(monthDetail.outstanding), C.red]].map(([l, v, color]) => (
              <div key={l} style={{ background: C.bg, borderRadius: 12, padding: 14, border: `0.5px solid ${C.border}`, textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color }}>{v}</div>
              </div>
            ))}
          </div>
          {monthDetail.rows.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: C.muted, fontSize: 14 }}>No payment records for this month.</div>
          ) : monthDetail.rows.map(p => (
            <div key={p.id} style={{ background: C.bg, borderRadius: 12, border: `0.5px solid ${p.status === "Paid" ? C.greenBorder : C.redBorder}`, padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{p.tenantName}</span>
                  <span style={{ fontSize: 12, color: C.muted }}> · {p.unitName}</span>
                </div>
                {p.status === "Paid"
                  ? <Pill label="Paid" color={C.green} bg={C.greenSoft} border={C.greenBorder} />
                  : <Pill label="Unpaid" color={C.red} bg={C.redSoft} border={C.redBorder} />}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <div style={{ background: C.surface, borderRadius: 8, padding: "4px 10px", border: `0.5px solid ${C.border}`, fontSize: 12 }}>Rent: {fmt(p.amount)}</div>
                {p.water_bill > 0 && <div style={{ background: C.blueSoft, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: C.blue }}>Water: {fmt(p.water_bill)}</div>}
                {p.electricity_bill > 0 && <div style={{ background: C.amberSoft, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: C.amber }}>Elec: {fmt(p.electricity_bill)}</div>}
                <div style={{ background: C.accentSoft, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: C.accent, fontWeight: 600 }}>Total: {fmt(p.total_due || p.amount)}</div>
              </div>
              {p.paid_on && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Paid on {fmtDate(p.paid_on)}</div>}
            </div>
          ))}
        </Sheet>
      )}

      {/* Tenant drill-down sheet */}
      {tenantDetail && (
        <Sheet title={tenantDetail.tenant.name} subtitle={`${tenantDetail.unit?.name} · ${tenantDetail.unit?.floor} · Score: ${tenantDetail.score}%`} onClose={() => setTenantDetail(null)}>
          {/* Score bar */}
          <div style={{ background: C.bg, borderRadius: 12, padding: 14, marginBottom: 16, border: `0.5px solid ${C.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Payment score</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: tenantDetail.score >= 80 ? C.green : tenantDetail.score >= 50 ? C.amber : C.red }}>{tenantDetail.score}%</span>
            </div>
            <div style={{ height: 6, background: C.border, borderRadius: 3 }}>
              <div style={{ height: 6, width: `${tenantDetail.score}%`, background: tenantDetail.score >= 80 ? C.green : tenantDetail.score >= 50 ? C.amber : C.red, borderRadius: 3, transition: "width 0.4s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <span style={{ fontSize: 11, color: C.muted }}>{tenantDetail.payments.filter(p => p.status === "Paid").length} paid</span>
              <span style={{ fontSize: 11, color: C.muted }}>{tenantDetail.payments.filter(p => p.status === "Unpaid").length} unpaid</span>
              <span style={{ fontSize: 11, color: C.muted }}>{tenantDetail.payments.length} total months</span>
            </div>
          </div>

          {tenantDetail.payments.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: C.muted, fontSize: 14 }}>No payment records.</div>
          ) : tenantDetail.payments.map(p => (
            <div key={p.id} style={{ background: C.bg, borderRadius: 12, border: `0.5px solid ${p.status === "Paid" ? C.greenBorder : C.redBorder}`, padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{MONTHS[p.month - 1]} {p.year}</span>
                {p.status === "Paid"
                  ? <Pill label="Paid" color={C.green} bg={C.greenSoft} border={C.greenBorder} />
                  : <Pill label="Unpaid" color={C.red} bg={C.redSoft} border={C.redBorder} />}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <div style={{ background: C.surface, borderRadius: 8, padding: "4px 10px", border: `0.5px solid ${C.border}`, fontSize: 12 }}>Rent: {fmt(p.amount)}</div>
                {p.water_bill > 0 && <div style={{ background: C.blueSoft, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: C.blue }}>Water: {fmt(p.water_bill)}</div>}
                {p.electricity_bill > 0 && <div style={{ background: C.amberSoft, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: C.amber }}>Elec: {fmt(p.electricity_bill)}</div>}
                <div style={{ background: C.accentSoft, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: C.accent, fontWeight: 600 }}>Total: {fmt(p.total_due || p.amount)}</div>
              </div>
              {p.paid_on && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Paid on {fmtDate(p.paid_on)}</div>}
              {p.notes && <div style={{ fontSize: 11, color: C.amber, marginTop: 2 }}>{p.notes}</div>}
            </div>
          ))}
        </Sheet>
      )}
    </div>
  )
}

// ── HELP SHEET ──────────────────────────────────────────────────────────────────
function HelpSheet({ lt, onClose }) {
  return (
    <Sheet title={lt.help} onClose={onClose}>
      {lt.helpContent.map((s, i) => (
        <div key={i} style={{ background: C.bg, borderRadius: 14, padding: 16, marginBottom: 10, border: `0.5px solid ${C.border}` }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 6 }}>{s.title}</div>
          <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.7 }}>{s.body}</div>
        </div>
      ))}
      <div style={{ background: C.accentSoft, borderRadius: 14, padding: 16, border: `0.5px solid ${C.accentBorder}` }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: C.accent, marginBottom: 10 }}>{lt.routine}</div>
        {lt.routineSteps.map((s, i) => (
          <div key={i} style={{ fontSize: 13, color: C.sub, marginBottom: 6, display: "flex", gap: 8 }}>
            <span style={{ fontWeight: 700, color: C.accent, flexShrink: 0 }}>{i + 1}.</span>
            <span>{s}</span>
          </div>
        ))}
      </div>
    </Sheet>
  )
}

// ── ROOT ────────────────────────────────────────────────────────────────────────
export default function LandlordApp({ user, onLogout }) {
  const [units, setUnits] = useState([])
  const [tenants, setTenants] = useState([])
  const [payments, setPayments] = useState([])
  const [activeNotices, setActiveNotices] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("home")
  const [selectedTenant, setSelectedTenant] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [lang, setLang] = useState(() => localStorage.getItem("ll_lang") || "en")
  const lt = LT[lang] || LT.en

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  useEffect(() => { setActor(user?.name) }, [user])

  useEffect(() => {
    Promise.all([
      supabase.from("units").select("*").order("id"),
      supabase.from("tenants").select("*").eq("status", "Active").order("id"),
      supabase.from("payment_records").select("*").order("year").order("month"),
      supabase.from("notices").select("*").eq("status", "Active"),
      supabase.from("applications").select("*").order("applied_at", { ascending: false }),
    ]).then(([{ data: u }, { data: t }, { data: p }, { data: n }, { data: a }]) => {
      if (u) setUnits(u)
      if (t) setTenants(t)
      if (p) setPayments(p)
      if (n) setActiveNotices(n)
      if (a) setApplications(a)
      setLoading(false)
    })
  }, [])

  const TABS = [
    { key: "home", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label: lt.tabs.home },
    { key: "units", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>, label: lt.tabs.units },
    { key: "bills", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>, label: lt.tabs.bills },
    { key: "issues", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>, label: lt.tabs.issues },
    { key: "broadcast", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>, label: lt.tabs.broadcast },
    { key: "analytics", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, label: lt.tabs.analytics },
  ]

  return (
    <LangCtx.Provider value={lt}>
      <div style={{ minHeight: "100vh", minHeight: "100dvh", background: C.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", paddingBottom: "calc(88px + env(safe-area-inset-bottom, 0px))", overscrollBehavior: "none" }}>
        {/* Header */}
        <div style={{ background: C.surface, borderBottom: `0.5px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ height: 3, background: "linear-gradient(90deg, #5046e5, #7c3aed)" }} />
          <div style={{ maxWidth: 500, margin: "0 auto", padding: "14px 18px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "max(14px, calc(env(safe-area-inset-top, 0px) + 10px))" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: C.text, letterSpacing: "-0.4px" }}>{lt.appName}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{fmt(tenants.reduce((s, t) => s + Number(t.rent), 0))}{lt.mo} · {now.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</div>
            </div>
            <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
              <button onClick={() => setShowHelp(true)} style={{ width: 32, height: 32, borderRadius: 9, background: C.bg, border: `0.5px solid ${C.border}`, cursor: "pointer", color: C.muted, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" }}>?</button>
              <button onClick={() => { const next = lang === "en" ? "kn" : "en"; localStorage.setItem("ll_lang", next); setLang(next) }}
                style={{ padding: "5px 9px", borderRadius: 9, background: C.bg, border: `0.5px solid ${C.border}`, cursor: "pointer", fontSize: 11, color: C.muted, fontWeight: 600, fontFamily: "inherit" }}>
                {lang === "en" ? "ಕನ್ನಡ" : "EN"}
              </button>
              <button onClick={onLogout} style={{ background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, borderRadius: 10, padding: "6px 11px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontWeight: 600, fontSize: 12, color: C.accent }}>{user?.name?.split(" ")[0]}</span>
                <span style={{ fontSize: 10, color: C.muted }}>{lt.logout}</span>
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 500, margin: "0 auto", padding: "16px 16px" }}>
          {loading ? (
            <div>
              <style>{`@keyframes pm-shimmer{0%{opacity:.55}50%{opacity:1}100%{opacity:.55}}`}</style>
              {(() => { const sk = (h, w = "100%", mb = 10, r = 14) => <div style={{ height: h, width: w, background: C.border, borderRadius: r, marginBottom: mb, animation: "pm-shimmer 1.2s ease-in-out infinite" }} />; return (
                <>
                  {sk(70)}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>{sk(88, "100%", 0)}{sk(88, "100%", 0)}{sk(88, "100%", 0)}{sk(88, "100%", 0)}</div>
                  {sk(64)}{sk(64)}{sk(64)}
                </>
              ) })()}
            </div>
          ) : (
            <>
              {activeTab === "home" && <HomeTab units={units} tenants={tenants} activeNotices={activeNotices} payments={payments} onSelectTenant={(t, u) => { setSelectedTenant(t); setSelectedUnit(u) }} setTenants={setTenants} setPayments={setPayments} currentMonth={currentMonth} currentYear={currentYear} />}
              {activeTab === "units" && <UnitsTab units={units} tenants={tenants} activeNotices={activeNotices} applications={applications} onSelectTenant={(t, u) => { setSelectedTenant(t); setSelectedUnit(u) }} setTenants={setTenants} setUnits={setUnits} setApplications={setApplications} />}
              {activeTab === "bills" && <BillsTab tenants={tenants} units={units} />}
              {activeTab === "issues" && <MaintenanceTab />}
              {activeTab === "broadcast" && <BroadcastTab tenants={tenants} units={units} setTenants={setTenants} />}
              {activeTab === "analytics" && <AnalyticsTab tenants={tenants} units={units} payments={payments} />}
            </>
          )}
        </div>

        {selectedTenant && selectedUnit && (
          <TenantDetail tenant={selectedTenant} unit={selectedUnit} onClose={() => { setSelectedTenant(null); setSelectedUnit(null) }} setTenants={setTenants} setUnits={setUnits} setActiveNotices={setActiveNotices} allPayments={payments} setAllPayments={setPayments} />
        )}

        {showHelp && <HelpSheet lt={lt} onClose={() => setShowHelp(false)} />}

        {/* Bottom nav */}
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `0.5px solid ${C.border}`, zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <div style={{ maxWidth: 500, margin: "0 auto", display: "flex", justifyContent: "space-around", padding: "6px 0 10px" }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "6px 8px", borderRadius: 12, position: "relative", transition: "opacity 0.15s", minWidth: 0 }}>
                {activeTab === t.key && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 20, height: 2.5, borderRadius: 2, background: C.accent }} />}
                <span style={{ color: activeTab === t.key ? C.accent : C.muted, transition: "color 0.15s" }}>{t.icon}</span>
                <span style={{ fontSize: 9, fontWeight: activeTab === t.key ? 700 : 400, color: activeTab === t.key ? C.accent : C.muted, transition: "color 0.15s", letterSpacing: "-0.1px" }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </LangCtx.Provider>
  )
}