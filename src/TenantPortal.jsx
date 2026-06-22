import { useState, useEffect } from "react"
import { supabase } from "./supabase"
import { getPushState, enablePush } from "./push"
import { toast } from "./toast"

const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN")
const fmtDate = (d) => { if (!d) return ""; const x = new Date(d); return isNaN(x) ? d : x.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) }
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const UPI_ID = "kavitha1713-2@okaxis"
const UPI_NAME = "Kavitha"
function notifyLandlord(text) {
  fetch("/api/notify-landlord", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) }).catch(() => {})
}

function isOverdue(month, year) {
  return new Date() > new Date(year, month, 10)
}

const C = {
  bg: "#f5f5f7", surface: "#ffffff", border: "#e8e8f0",
  accent: "#5046e5", accentSoft: "#ede9fe", accentBorder: "#c4b5fd",
  text: "#1a1a2e", sub: "#4a4a6a", muted: "#9090a8",
  green: "#059669", greenSoft: "#d1fae5", greenBorder: "#6ee7b7",
  red: "#dc2626", redSoft: "#fee2e2", redBorder: "#fca5a5",
  amber: "#d97706", amberSoft: "#fef3c7", amberBorder: "#fcd34d",
  blue: "#2563eb", blueSoft: "#dbeafe", blueBorder: "#93c5fd",
}

const LANGS = {
  en: {
    appName: "Property Manager",
    hello: "Good morning", helloAfternoon: "Good afternoon", helloEvening: "Good evening",
    tenantSince: "Tenant since",
    tabs: { home: "Home", payments: "Payments", documents: "Documents", issues: "Issues", notice: "Notice" },
    monthlyRent: "Monthly rent", advancePaid: "Advance paid", unit: "Unit",
    overdueTitle: "Overdue payments", pendingTitle: "Upcoming payment",
    overdueDesc: "These months are past due. Please pay as soon as possible.",
    payNow: "Pay now", paid: "Paid", unpaid: "Unpaid", overdue: "Overdue", pending: "Pending",
    iHavePaid: "I've paid", verifying: "Confirming payment...",
    verifyingDesc: "Your landlord will confirm your payment shortly.",
    confirmed: "Confirmed", disputed: "Needs attention",
    disputedDesc: "Your landlord could not confirm this payment. Please review and pay again.",
    disputeReason: "Reason",
    notifTitle: "Get notified", notifDesc: "Turn on alerts for payment confirmations, new bills, and updates.",
    notifEnable: "Enable notifications", notifOn: "Notifications are on", notifWorking: "Turning on...",
    notifInstall: "To get alerts on iPhone: tap the Share icon, choose 'Add to Home Screen', then open the app from your home screen and enable here.",
    notifBlocked: "Notifications are blocked. Turn them on in your browser settings.",
    onboard: { welcome: "Welcome", subtitle: "Here is everything you can do here:", cta: "Get started",
      steps: [
        { t: "Pay rent easily", d: "Pay with any UPI app in seconds, right from your phone." },
        { t: "Stay in the loop", d: "Track payment status, get alerts, and save receipts." },
        { t: "Docs and issues", d: "Upload your documents and report maintenance anytime." },
      ] },
    dueBy: "Due by", paidOn: "Paid on",
    totalDue: "Total due", rent: "Rent", water: "Water", electricity: "Electricity",
    chooseApp: "Pay using",
    paySteps: ["Open your UPI app", "Send to", "Enter exact amount", "Add your name and unit as note", "Tap Pay"],
    payNote: (name, unit) => `${name} - ${unit}`,
    payDone: "I've paid — confirm payment",
    payDoneDesc: "Your landlord will verify and confirm. Status will update shortly.",
    noPayments: "No payment records yet.",
    documents: "Documents",
    aadhaar: "Aadhaar Card", aadhaarDesc: "Upload front and back (photo or PDF)",
    pan: "PAN Card", panDesc: "Upload a clear copy",
    otherDocs: "Other documents",
    agreementTitle: "Rental Agreement",
    agreementDesc: "Your rental agreement will appear here once uploaded by your landlord.",
    upload: "Upload", uploading: "Uploading...", uploaded: "Uploaded", viewDoc: "View",
    reportIssue: "Report an issue",
    issueDesc: "Describe the problem", issuePlaceholder: "e.g. Water tap is leaking in bathroom",
    addPhoto: "Add photo (optional)", submitting: "Submitting...",
    submitIssue: "Submit issue",
    issueSubmitted: "Issue submitted! Your landlord will review it shortly.",
    previousIssues: "Previous issues",
    noIssues: "No issues reported yet.",
    open: "Open", inProgress: "In progress", resolved: "Resolved",
    noticeTitle: "Notice to vacate",
    noticeDesc: "Planning to move out? Give at least 30 days notice. Your landlord will be notified immediately.",
    moveOutDate: "Move-out date", minNotice: "Minimum 30 days from today",
    advancePaidL: "Advance paid", outstandingDues: "Outstanding dues", settlement: "Settlement",
    refundDesc: "Your landlord will refund this amount when you vacate.",
    owesDesc: "This will be deducted from your advance before refund.",
    submitNotice: "Submit notice to vacate",
    noticePending: "Notice submitted",
    noticeCancelled: "Notice cancelled. You are still a tenant. Contact your landlord if you have questions.",
    noticeActive: "Notice to vacate submitted",
    moveOutLabel: "Move-out date",
    landlordNotified: "Your landlord has been notified.",
    cancelNotice: "Cancel notice",
    cancelNoticeSure: "Cancel your notice to vacate?",
    settled: "Vacated",
    selectLang: "Choose your language",
    langDesc: "You can change this later from the app.",
  },
  hi: {
    appName: "प्रॉपर्टी मैनेजर",
    hello: "सुप्रभात", helloAfternoon: "नमस्कार", helloEvening: "शुभ संध्या",
    tenantSince: "किराएदार",
    tabs: { home: "होम", payments: "भुगतान", documents: "दस्तावेज", issues: "समस्याएं", notice: "नोटिस" },
    monthlyRent: "मासिक किराया", advancePaid: "अग्रिम राशि", unit: "यूनिट",
    overdueTitle: "बकाया भुगतान", pendingTitle: "आगामी भुगतान",
    overdueDesc: "ये महीने बकाया हैं। कृपया जल्द से जल्द भुगतान करें।",
    payNow: "अभी भुगतान करें", paid: "भुगतान हुआ", unpaid: "बकाया", overdue: "विलंबित", pending: "लंबित",
    iHavePaid: "मैंने भुगतान किया", verifying: "भुगतान की पुष्टि हो रही है...",
    verifyingDesc: "आपके मकान मालिक जल्द ही पुष्टि करेंगे।",
    confirmed: "पुष्टि हो गई", disputed: "ध्यान दें",
    disputedDesc: "आपके मकान मालिक इस भुगतान की पुष्टि नहीं कर सके। कृपया जांचें और दोबारा भुगतान करें।",
    disputeReason: "कारण",
    notifTitle: "सूचनाएं पाएं", notifDesc: "भुगतान पुष्टि, नए बिल और अपडेट के लिए अलर्ट चालू करें।",
    notifEnable: "सूचनाएं चालू करें", notifOn: "सूचनाएं चालू हैं", notifWorking: "चालू हो रहा है...",
    notifInstall: "iPhone पर अलर्ट के लिए: शेयर आइकन दबाएं, 'Add to Home Screen' चुनें, फिर होम स्क्रीन से ऐप खोलें और यहां चालू करें।",
    notifBlocked: "सूचनाएं अवरुद्ध हैं। उन्हें ब्राउज़र सेटिंग्स में चालू करें।",
    onboard: { welcome: "स्वागत है", subtitle: "यहां आप यह सब कर सकते हैं:", cta: "शुरू करें",
      steps: [
        { t: "आसानी से किराया भरें", d: "किसी भी UPI ऐप से कुछ ही सेकंड में फोन से भुगतान करें।" },
        { t: "अपडेट रहें", d: "भुगतान स्थिति देखें, अलर्ट पाएं और रसीद सहेजें।" },
        { t: "दस्तावेज़ और शिकायतें", d: "अपने दस्तावेज़ अपलोड करें और कभी भी समस्या बताएं।" },
      ] },
    dueBy: "देय तिथि", paidOn: "भुगतान तिथि",
    totalDue: "कुल देय", rent: "किराया", water: "पानी", electricity: "बिजली",
    chooseApp: "भुगतान करें",
    paySteps: ["UPI ऐप खोलें", "इस नंबर पर भेजें", "सटीक राशि दर्ज करें", "नाम और यूनिट नोट में डालें", "Pay दबाएं"],
    payNote: (name, unit) => `${name} - ${unit}`,
    payDone: "मैंने भुगतान किया — पुष्टि करें",
    payDoneDesc: "आपके मकान मालिक जल्द पुष्टि करेंगे।",
    noPayments: "अभी तक कोई रिकॉर्ड नहीं।",
    documents: "दस्तावेज",
    aadhaar: "आधार कार्ड", aadhaarDesc: "आगे और पीछे की फोटो या PDF",
    pan: "पैन कार्ड", panDesc: "स्पष्ट फोटो",
    otherDocs: "अन्य दस्तावेज",
    agreementTitle: "किराया समझौता",
    agreementDesc: "आपका किराया समझौता यहां दिखेगा।",
    upload: "अपलोड", uploading: "अपलोड हो रहा है...", uploaded: "अपलोड हो गया", viewDoc: "देखें",
    reportIssue: "समस्या रिपोर्ट करें",
    issueDesc: "समस्या का विवरण", issuePlaceholder: "उदाहरण: बाथरूम में नल से पानी लीक हो रहा है",
    addPhoto: "फोटो जोड़ें (वैकल्पिक)", submitting: "सबमिट हो रहा है...",
    submitIssue: "समस्या सबमिट करें",
    issueSubmitted: "समस्या सबमिट हुई! आपके मकान मालिक जल्द देखेंगे।",
    previousIssues: "पुरानी समस्याएं",
    noIssues: "अभी तक कोई समस्या नहीं।",
    open: "खुली", inProgress: "प्रक्रिया में", resolved: "हल हुई",
    noticeTitle: "खाली करने का नोटिस",
    noticeDesc: "घर छोड़ने की योजना है? कम से कम 30 दिन पहले बताएं।",
    moveOutDate: "खाली करने की तिथि", minNotice: "आज से कम से कम 30 दिन",
    advancePaidL: "अग्रिम राशि", outstandingDues: "बकाया राशि", settlement: "सेटलमेंट",
    refundDesc: "खाली करने पर यह राशि वापस मिलेगी।",
    owesDesc: "यह राशि अग्रिम से काटी जाएगी।",
    submitNotice: "नोटिस सबमिट करें",
    noticePending: "नोटिस सबमिट हुआ",
    noticeCancelled: "नोटिस रद्द। आप अभी भी किराएदार हैं।",
    noticeActive: "खाली करने का नोटिस सबमिट किया",
    moveOutLabel: "खाली करने की तिथि",
    landlordNotified: "आपके मकान मालिक को सूचित किया गया है।",
    cancelNotice: "नोटिस रद्द करें",
    cancelNoticeSure: "नोटिस रद्द करें?",
    settled: "खाली किया",
    selectLang: "अपनी भाषा चुनें",
    langDesc: "आप इसे बाद में बदल सकते हैं।",
  },
  ta: {
    appName: "சொத்து மேலாளர்",
    hello: "காலை வணக்கம்", helloAfternoon: "வணக்கம்", helloEvening: "மாலை வணக்கம்",
    tenantSince: "வாடகைதாரர்",
    tabs: { home: "முகப்பு", payments: "கட்டணம்", documents: "ஆவணங்கள்", issues: "பிரச்சனைகள்", notice: "நோட்டீஸ்" },
    monthlyRent: "மாத வாடகை", advancePaid: "முன்பணம்", unit: "அலகு",
    overdueTitle: "நிலுவை கட்டணங்கள்", pendingTitle: "வரவிருக்கும் கட்டணம்",
    overdueDesc: "இந்த மாதங்களுக்கு கட்டணம் தாமதமாகிவிட்டது.",
    payNow: "இப்போது செலுத்து", paid: "செலுத்தியது", unpaid: "நிலுவை", overdue: "தாமதம்", pending: "நிலுவை",
    iHavePaid: "செலுத்தினேன்", verifying: "கட்டணம் உறுதிப்படுத்தப்படுகிறது...",
    verifyingDesc: "உங்கள் வீட்டுடமையாளர் விரைவில் உறுதிப்படுத்துவார்.",
    confirmed: "உறுதிப்படுத்தப்பட்டது", disputed: "கவனம் தேவை",
    disputedDesc: "உங்கள் வீட்டுடமையாளர் இந்தக் கட்டணத்தை உறுதிப்படுத்த முடியவில்லை. சரிபார்த்து மீண்டும் செலுத்தவும்.",
    disputeReason: "காரணம்",
    notifTitle: "அறிவிப்புகள் பெறுங்கள்", notifDesc: "கட்டண உறுதி, புதிய பில்கள் மற்றும் புதுப்பிப்புகளுக்கான விழிப்பூட்டல்களை இயக்கவும்.",
    notifEnable: "அறிவிப்புகளை இயக்கு", notifOn: "அறிவிப்புகள் இயக்கப்பட்டுள்ளன", notifWorking: "இயக்குகிறது...",
    notifInstall: "iPhone இல் விழிப்பூட்டல்களுக்கு: Share ஐகானை அழுத்தி, 'Add to Home Screen' தேர்வுசெய்து, பின்னர் ஹோம் ஸ்கிரீனில் இருந்து ஆப்பைத் திறந்து இங்கே இயக்கவும்.",
    notifBlocked: "அறிவிப்புகள் தடுக்கப்பட்டுள்ளன. உலாவி அமைப்புகளில் இயக்கவும்.",
    onboard: { welcome: "வரவேற்கிறோம்", subtitle: "இங்கே நீங்கள் செய்யக்கூடியவை:", cta: "தொடங்குங்கள்",
      steps: [
        { t: "எளிதாக வாடகை செலுத்துங்கள்", d: "எந்த UPI ஆப்பிலும் சில வினாடிகளில் போனில் இருந்து செலுத்துங்கள்." },
        { t: "புதுப்பிப்புகளை அறியுங்கள்", d: "கட்டண நிலையைப் பாருங்கள், விழிப்பூட்டல் பெறுங்கள், ரசீதுகளைச் சேமியுங்கள்." },
        { t: "ஆவணங்கள் மற்றும் சிக்கல்கள்", d: "உங்கள் ஆவணங்களைப் பதிவேற்றி எப்போது வேண்டுமானாலும் சிக்கலைத் தெரிவியுங்கள்." },
      ] },
    dueBy: "கடைசி தேதி", paidOn: "செலுத்திய தேதி",
    totalDue: "மொத்த தொகை", rent: "வாடகை", water: "தண்ணீர்", electricity: "மின்சாரம்",
    chooseApp: "செலுத்தவும்",
    paySteps: ["UPI ஆப் திறக்கவும்", "இந்த எண்ணுக்கு அனுப்பவும்", "சரியான தொகை உள்ளிடவும்", "பெயர் மற்றும் அலகு குறிப்பிடவும்", "Pay அழுத்தவும்"],
    payNote: (name, unit) => `${name} - ${unit}`,
    payDone: "செலுத்தினேன் — உறுதிப்படுத்தவும்",
    payDoneDesc: "உங்கள் வீட்டுடமையாளர் விரைவில் உறுதிப்படுத்துவார்.",
    noPayments: "இன்னும் பதிவுகள் இல்லை.",
    documents: "ஆவணங்கள்",
    aadhaar: "ஆதார் அட்டை", aadhaarDesc: "முன் மற்றும் பின் புகைப்படம் அல்லது PDF",
    pan: "பான் அட்டை", panDesc: "தெளிவான புகைப்படம்",
    otherDocs: "மற்ற ஆவணங்கள்",
    agreementTitle: "வாடகை ஒப்பந்தம்",
    agreementDesc: "உங்கள் வாடகை ஒப்பந்தம் இங்கே தெரியும்.",
    upload: "பதிவேற்றம்", uploading: "பதிவேற்றுகிறது...", uploaded: "பதிவேற்றப்பட்டது", viewDoc: "பார்க்கவும்",
    reportIssue: "பிரச்சனை தெரிவிக்கவும்",
    issueDesc: "பிரச்சனை விவரிக்கவும்", issuePlaceholder: "எ.கா. குளியலறையில் குழாய் கசிகிறது",
    addPhoto: "புகைப்படம் சேர்க்கவும்", submitting: "சமர்ப்பிக்கிறது...",
    submitIssue: "பிரச்சனை சமர்ப்பிக்கவும்",
    issueSubmitted: "பிரச்சனை சமர்ப்பிக்கப்பட்டது!",
    previousIssues: "முந்தைய பிரச்சனைகள்",
    noIssues: "இன்னும் பிரச்சனைகள் இல்லை.",
    open: "திறந்த", inProgress: "நடந்துகொண்டிருக்கும்", resolved: "தீர்க்கப்பட்டது",
    noticeTitle: "வெளியேற நோட்டீஸ்",
    noticeDesc: "குறைந்தது 30 நாள் முன்னதாக தெரிவிக்கவும்.",
    moveOutDate: "வெளியேறும் தேதி", minNotice: "இன்றிலிருந்து குறைந்தது 30 நாட்கள்",
    advancePaidL: "செலுத்திய முன்பணம்", outstandingDues: "நிலுவை தொகை", settlement: "தீர்வு",
    refundDesc: "வெளியேறும்போது இந்த தொகை திரும்பக் கிடைக்கும்.",
    owesDesc: "இந்த தொகை முன்பணத்திலிருந்து கழிக்கப்படும்.",
    submitNotice: "நோட்டீஸ் சமர்ப்பிக்கவும்",
    noticePending: "நோட்டீஸ் சமர்ப்பிக்கப்பட்டது",
    noticeCancelled: "நோட்டீஸ் ரத்து செய்யப்பட்டது.",
    noticeActive: "வெளியேற நோட்டீஸ் சமர்ப்பிக்கப்பட்டது",
    moveOutLabel: "வெளியேறும் தேதி",
    landlordNotified: "உங்கள் வீட்டுடமையாளருக்கு தெரிவிக்கப்பட்டது.",
    cancelNotice: "நோட்டீஸ் ரத்து", cancelNoticeSure: "நோட்டீஸ் ரத்து செய்யவா?",
    settled: "வெளியேறியது",
    selectLang: "உங்கள் மொழியை தேர்ந்தெடுக்கவும்",
    langDesc: "நீங்கள் பின்னர் மாற்றலாம்.",
  },
  te: {
    appName: "ప్రాపర్టీ మేనేజర్",
    hello: "శుభోదయం", helloAfternoon: "నమస్కారం", helloEvening: "శుభ సాయంత్రం",
    tenantSince: "అద్దెదారు",
    tabs: { home: "హోమ్", payments: "చెల్లింపులు", documents: "పత్రాలు", issues: "సమస్యలు", notice: "నోటీసు" },
    monthlyRent: "నెల అద్దె", advancePaid: "అడ్వాన్స్", unit: "యూనిట్",
    overdueTitle: "బకాయి చెల్లింపులు", pendingTitle: "రాబోయే చెల్లింపు",
    overdueDesc: "ఈ నెలలు బకాయి ఉన్నాయి. దయచేసి వీలైనంత త్వరగా చెల్లించండి.",
    payNow: "ఇప్పుడు చెల్లించు", paid: "చెల్లించబడింది", unpaid: "బకాయి", overdue: "ఆలస్యం", pending: "పెండింగ్",
    iHavePaid: "నేను చెల్లించాను", verifying: "చెల్లింపు నిర్ధారిస్తున్నాం...",
    verifyingDesc: "మీ యజమాని త్వరలో నిర్ధారిస్తారు.",
    confirmed: "నిర్ధారించబడింది", disputed: "శ్రద్ధ అవసరం",
    disputedDesc: "మీ యజమాని ఈ చెల్లింపును నిర్ధారించలేకపోయారు. దయచేసి సరిచూసి మళ్లీ చెల్లించండి.",
    disputeReason: "కారణం",
    notifTitle: "నోటిఫికేషన్లు పొందండి", notifDesc: "చెల్లింపు నిర్ధారణలు, కొత్త బిల్లులు మరియు అప్‌డేట్‌ల కోసం హెచ్చరికలను ఆన్ చేయండి.",
    notifEnable: "నోటిఫికేషన్లు ఆన్ చేయి", notifOn: "నోటిఫికేషన్లు ఆన్‌లో ఉన్నాయి", notifWorking: "ఆన్ చేస్తోంది...",
    notifInstall: "iPhoneలో హెచ్చరికల కోసం: షేర్ చిహ్నాన్ని నొక్కి, 'Add to Home Screen' ఎంచుకుని, ఆపై హోమ్ స్క్రీన్ నుండి యాప్ తెరిచి ఇక్కడ ఆన్ చేయండి.",
    notifBlocked: "నోటిఫికేషన్లు బ్లాక్ చేయబడ్డాయి. బ్రౌజర్ సెట్టింగ్‌లలో ఆన్ చేయండి.",
    onboard: { welcome: "స్వాగతం", subtitle: "ఇక్కడ మీరు చేయగలిగేవి:", cta: "ప్రారంభించండి",
      steps: [
        { t: "సులభంగా అద్దె చెల్లించండి", d: "ఏ UPI యాప్‌తోనైనా క్షణాల్లో ఫోన్ నుండి చెల్లించండి." },
        { t: "అప్‌డేట్‌గా ఉండండి", d: "చెల్లింపు స్థితి చూడండి, హెచ్చరికలు పొందండి, రసీదులు సేవ్ చేయండి." },
        { t: "పత్రాలు, సమస్యలు", d: "మీ పత్రాలను అప్‌లోడ్ చేయండి, ఎప్పుడైనా సమస్యను నివేదించండి." },
      ] },
    dueBy: "చివరి తేదీ", paidOn: "చెల్లింపు తేదీ",
    totalDue: "మొత్తం", rent: "అద్దె", water: "నీరు", electricity: "విద్యుత్",
    chooseApp: "చెల్లించండి",
    paySteps: ["UPI యాప్ తెరవండి", "ఈ నంబర్‌కు పంపండి", "సరైన మొత్తం నమోదు చేయండి", "పేరు మరియు యూనిట్ గమనిక జోడించండి", "Pay నొక్కండి"],
    payNote: (name, unit) => `${name} - ${unit}`,
    payDone: "నేను చెల్లించాను — నిర్ధారించండి",
    payDoneDesc: "మీ యజమాని త్వరలో నిర్ధారిస్తారు.",
    noPayments: "ఇంకా రికార్డులు లేవు.",
    documents: "పత్రాలు",
    aadhaar: "ఆధార్ కార్డ్", aadhaarDesc: "ముందు మరియు వెనక ఫోటో లేదా PDF",
    pan: "పాన్ కార్డ్", panDesc: "స్పష్టమైన ఫోటో",
    otherDocs: "ఇతర పత్రాలు",
    agreementTitle: "అద్దె ఒప్పందం",
    agreementDesc: "మీ అద్దె ఒప్పందం ఇక్కడ కనిపిస్తుంది.",
    upload: "అప్‌లోడ్", uploading: "అప్‌లోడ్ అవుతోంది...", uploaded: "అప్‌లోడ్ అయింది", viewDoc: "చూడండి",
    reportIssue: "సమస్యను నివేదించండి",
    issueDesc: "సమస్యను వివరించండి", issuePlaceholder: "ఉదా: బాత్‌రూమ్‌లో నల్లా లీక్ అవుతోంది",
    addPhoto: "ఫోటో జోడించండి", submitting: "సమర్పిస్తున్నాం...",
    submitIssue: "సమస్యను సమర్పించండి",
    issueSubmitted: "సమస్య సమర్పించబడింది!",
    previousIssues: "గత సమస్యలు",
    noIssues: "ఇంకా సమస్యలు లేవు.",
    open: "తెరిచిన", inProgress: "పురోగతిలో ఉంది", resolved: "పరిష్కరించబడింది",
    noticeTitle: "ఖాళీ చేయడానికి నోటీసు",
    noticeDesc: "కనీసం 30 రోజుల ముందు తెలియజేయండి.",
    moveOutDate: "ఖాళీ చేసే తేదీ", minNotice: "నేటి నుండి కనీసం 30 రోజులు",
    advancePaidL: "అడ్వాన్స్ చెల్లించారు", outstandingDues: "బకాయి మొత్తం", settlement: "సెటిల్‌మెంట్",
    refundDesc: "ఖాళీ చేసేటప్పుడు ఈ మొత్తం తిరిగి ఇవ్వబడుతుంది.",
    owesDesc: "ఈ మొత్తం అడ్వాన్స్‌ నుండి తీసివేయబడుతుంది.",
    submitNotice: "నోటీసు సమర్పించండి",
    noticePending: "నోటీసు సమర్పించబడింది",
    noticeCancelled: "నోటీసు రద్దు చేయబడింది.",
    noticeActive: "ఖాళీ చేయడానికి నోటీసు సమర్పించబడింది",
    moveOutLabel: "ఖాళీ చేసే తేదీ",
    landlordNotified: "మీ యజమానికి తెలియజేయబడింది.",
    cancelNotice: "నోటీసు రద్దు", cancelNoticeSure: "నోటీసు రద్దు చేయాలా?",
    settled: "ఖాళీ చేశారు",
    selectLang: "మీ భాషను ఎంచుకోండి",
    langDesc: "మీరు తర్వాత మార్చవచ్చు.",
  },
  kn: {
    appName: "ಪ್ರಾಪರ್ಟಿ ಮ್ಯಾನೇಜರ್",
    hello: "ಶುಭೋದಯ", helloAfternoon: "ನಮಸ್ಕಾರ", helloEvening: "ಶುಭ ಸಂಜೆ",
    tenantSince: "ಬಾಡಿಗೆದಾರ",
    tabs: { home: "ಮುಖಪುಟ", payments: "ಪಾವತಿ", documents: "ದಾಖಲೆ", issues: "ಸಮಸ್ಯೆ", notice: "ನೋಟಿಸ್" },
    monthlyRent: "ತಿಂಗಳ ಬಾಡಿಗೆ", advancePaid: "ಮುಂಗಡ", unit: "ಯೂನಿಟ್",
    overdueTitle: "ಬಾಕಿ ಪಾವತಿ", pendingTitle: "ಮುಂದಿನ ಪಾವತಿ",
    overdueDesc: "ಈ ತಿಂಗಳುಗಳ ಪಾವತಿ ತಡವಾಗಿದೆ. ದಯವಿಟ್ಟು ಶೀಘ್ರ ಪಾವತಿಸಿ.",
    payNow: "ಈಗ ಪಾವತಿಸಿ", paid: "ಪಾವತಿಯಾಗಿದೆ", unpaid: "ಬಾಕಿ", overdue: "ತಡ", pending: "ಬಾಕಿ ಇದೆ",
    iHavePaid: "ನಾನು ಪಾವತಿಸಿದ್ದೇನೆ", verifying: "ಪಾವತಿ ದೃಢೀಕರಿಸಲಾಗುತ್ತಿದೆ...",
    verifyingDesc: "ನಿಮ್ಮ ಮನೆಮಾಲೀಕರು ಶೀಘ್ರ ದೃಢೀಕರಿಸುತ್ತಾರೆ.",
    confirmed: "ದೃಢೀಕರಿಸಲಾಗಿದೆ", disputed: "ಗಮನ ಅಗತ್ಯವಿದೆ",
    disputedDesc: "ನಿಮ್ಮ ಮನೆಮಾಲೀಕರು ಈ ಪಾವತಿಯನ್ನು ದೃಢೀಕರಿಸಲಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪಾವತಿಸಿ.",
    disputeReason: "ಕಾರಣ",
    notifTitle: "ಅಧಿಸೂಚನೆಗಳನ್ನು ಪಡೆಯಿರಿ", notifDesc: "ಪಾವತಿ ದೃಢೀಕರಣ, ಹೊಸ ಬಿಲ್‌ಗಳು ಮತ್ತು ನವೀಕರಣಗಳಿಗೆ ಎಚ್ಚರಿಕೆಗಳನ್ನು ಆನ್ ಮಾಡಿ.",
    notifEnable: "ಅಧಿಸೂಚನೆಗಳನ್ನು ಆನ್ ಮಾಡಿ", notifOn: "ಅಧಿಸೂಚನೆಗಳು ಆನ್ ಆಗಿವೆ", notifWorking: "ಆನ್ ಮಾಡಲಾಗುತ್ತಿದೆ...",
    notifInstall: "iPhone ನಲ್ಲಿ ಎಚ್ಚರಿಕೆಗಳಿಗೆ: ಶೇರ್ ಐಕಾನ್ ಒತ್ತಿ, 'Add to Home Screen' ಆಯ್ಕೆಮಾಡಿ, ನಂತರ ಹೋಮ್ ಸ್ಕ್ರೀನ್‌ನಿಂದ ಆಪ್ ತೆರೆದು ಇಲ್ಲಿ ಆನ್ ಮಾಡಿ.",
    notifBlocked: "ಅಧಿಸೂಚನೆಗಳನ್ನು ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ. ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳಲ್ಲಿ ಆನ್ ಮಾಡಿ.",
    onboard: { welcome: "ಸ್ವಾಗತ", subtitle: "ಇಲ್ಲಿ ನೀವು ಮಾಡಬಹುದಾದವು:", cta: "ಪ್ರಾರಂಭಿಸಿ",
      steps: [
        { t: "ಸುಲಭವಾಗಿ ಬಾಡಿಗೆ ಪಾವತಿಸಿ", d: "ಯಾವುದೇ UPI ಆಪ್‌ನಿಂದ ಕ್ಷಣಗಳಲ್ಲಿ ಫೋನ್‌ನಿಂದ ಪಾವತಿಸಿ." },
        { t: "ಮಾಹಿತಿ ಪಡೆಯಿರಿ", d: "ಪಾವತಿ ಸ್ಥಿತಿ ನೋಡಿ, ಎಚ್ಚರಿಕೆ ಪಡೆಯಿರಿ, ರಸೀದಿ ಉಳಿಸಿ." },
        { t: "ದಾಖಲೆಗಳು ಮತ್ತು ಸಮಸ್ಯೆಗಳು", d: "ನಿಮ್ಮ ದಾಖಲೆಗಳನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ಯಾವಾಗ ಬೇಕಾದರೂ ಸಮಸ್ಯೆ ತಿಳಿಸಿ." },
      ] },
    dueBy: "ಕಟ್ಟಕಡೆಯ ದಿನಾಂಕ", paidOn: "ಪಾವತಿ ದಿನಾಂಕ",
    totalDue: "ಒಟ್ಟು ಮೊತ್ತ", rent: "ಬಾಡಿಗೆ", water: "ನೀರು", electricity: "ವಿದ್ಯುತ್",
    chooseApp: "ಪಾವತಿಸಿ",
    paySteps: ["UPI ಆ್ಯಪ್ ತೆರೆಯಿರಿ", "ಈ ನಂಬರ್‌ಗೆ ಕಳುಹಿಸಿ", "ನಿಖರ ಮೊತ್ತ ನಮೂದಿಸಿ", "ಹೆಸರು ಮತ್ತು ಯೂನಿಟ್ ಟಿಪ್ಪಣಿಯಾಗಿ ಸೇರಿಸಿ", "Pay ಒತ್ತಿರಿ"],
    payNote: (name, unit) => `${name} - ${unit}`,
    payDone: "ನಾನು ಪಾವತಿಸಿದ್ದೇನೆ — ದೃಢೀಕರಿಸಿ",
    payDoneDesc: "ನಿಮ್ಮ ಮನೆಮಾಲೀಕರು ಶೀಘ್ರ ದೃಢೀಕರಿಸುತ್ತಾರೆ.",
    noPayments: "ಇನ್ನೂ ರೆಕಾರ್ಡ್‌ಗಳಿಲ್ಲ.",
    documents: "ದಾಖಲೆಗಳು",
    aadhaar: "ಆಧಾರ್ ಕಾರ್ಡ್", aadhaarDesc: "ಮುಂಭಾಗ ಮತ್ತು ಹಿಂಭಾಗ ಫೋಟೋ ಅಥವಾ PDF",
    pan: "ಪ್ಯಾನ್ ಕಾರ್ಡ್", panDesc: "ಸ್ಪಷ್ಟ ಫೋಟೋ",
    otherDocs: "ಇತರ ದಾಖಲೆಗಳು",
    agreementTitle: "ಬಾಡಿಗೆ ಒಪ್ಪಂದ",
    agreementDesc: "ನಿಮ್ಮ ಬಾಡಿಗೆ ಒಪ್ಪಂದ ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತದೆ.",
    upload: "ಅಪ್‌ಲೋಡ್", uploading: "ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ...", uploaded: "ಅಪ್‌ಲೋಡ್ ಆಗಿದೆ", viewDoc: "ನೋಡಿ",
    reportIssue: "ಸಮಸ್ಯೆ ತಿಳಿಸಿ",
    issueDesc: "ಸಮಸ್ಯೆ ವಿವರಿಸಿ", issuePlaceholder: "ಉದಾ: ಬಾತ್‌ರೂಮ್‌ನಲ್ಲಿ ಟ್ಯಾಪ್ ಲೀಕ್ ಆಗುತ್ತಿದೆ",
    addPhoto: "ಫೋಟೋ ಸೇರಿಸಿ", submitting: "ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...",
    submitIssue: "ಸಮಸ್ಯೆ ಸಲ್ಲಿಸಿ",
    issueSubmitted: "ಸಮಸ್ಯೆ ಸಲ್ಲಿಸಲಾಗಿದೆ!",
    previousIssues: "ಹಿಂದಿನ ಸಮಸ್ಯೆಗಳು",
    noIssues: "ಇನ್ನೂ ಯಾವ ಸಮಸ್ಯೆಗಳಿಲ್ಲ.",
    open: "ತೆರೆದಿರುವ", inProgress: "ಪ್ರಗತಿಯಲ್ಲಿ", resolved: "ಪರಿಹರಿಸಲಾಗಿದೆ",
    noticeTitle: "ಖಾಲಿ ಮಾಡುವ ನೋಟಿಸ್",
    noticeDesc: "ಕನಿಷ್ಠ 30 ದಿನ ಮುಂಚಿತವಾಗಿ ತಿಳಿಸಿ.",
    moveOutDate: "ಹೊರಡುವ ದಿನಾಂಕ", minNotice: "ಇಂದಿನಿಂದ ಕನಿಷ್ಠ 30 ದಿನ",
    advancePaidL: "ಪಾವತಿಸಿದ ಮುಂಗಡ", outstandingDues: "ಬಾಕಿ ಮೊತ್ತ", settlement: "ಸೆಟಲ್‌ಮೆಂಟ್",
    refundDesc: "ಖಾಲಿ ಮಾಡುವಾಗ ಈ ಮೊತ್ತ ಮರಳಿ ಸಿಗುತ್ತದೆ.",
    owesDesc: "ಈ ಮೊತ್ತ ಮುಂಗಡದಿಂದ ಕಡಿತಗೊಳಿಸಲಾಗುತ್ತದೆ.",
    submitNotice: "ನೋಟಿಸ್ ಸಲ್ಲಿಸಿ",
    noticePending: "ನೋಟಿಸ್ ಸಲ್ಲಿಸಲಾಗಿದೆ",
    noticeCancelled: "ನೋಟಿಸ್ ರದ್ದಾಗಿದೆ. ನೀವು ಇನ್ನೂ ಬಾಡಿಗೆದಾರರಾಗಿದ್ದೀರಿ.",
    noticeActive: "ಖಾಲಿ ಮಾಡುವ ನೋಟಿಸ್ ಸಲ್ಲಿಸಲಾಗಿದೆ",
    moveOutLabel: "ಹೊರಡುವ ದಿನಾಂಕ",
    landlordNotified: "ನಿಮ್ಮ ಮನೆಮಾಲೀಕರಿಗೆ ತಿಳಿಸಲಾಗಿದೆ.",
    cancelNotice: "ನೋಟಿಸ್ ರದ್ದು", cancelNoticeSure: "ನೋಟಿಸ್ ರದ್ದು ಮಾಡಬೇಕೇ?",
    settled: "ಖಾಲಿ ಮಾಡಲಾಗಿದೆ",
    selectLang: "ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ",
    langDesc: "ನೀವು ನಂತರ ಬದಲಿಸಬಹುದು.",
  },
}

function greeting(lt) {
  const h = new Date().getHours()
  if (h < 12) return lt.hello
  if (h < 17) return lt.helloAfternoon
  return lt.helloEvening
}

function Pill({ label, color, bg, border }) {
  return <span style={{ background: bg, color, border: `0.5px solid ${border || color + "40"}`, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", alignSelf: "flex-start", lineHeight: 1.5 }}>{label}</span>
}

function Card({ children, style = {}, accent }) {
  return (
    <div style={{ background: C.surface, borderRadius: 16, border: `${accent ? "1.5px" : "0.5px"} solid ${accent ? C.accentBorder : C.border}`, padding: 16, ...style }}>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

const iStyle = { width: "100%", padding: "11px 14px", background: C.bg, border: `0.5px solid ${C.border}`, borderRadius: 12, fontSize: 14, color: C.text, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }

// ── LANGUAGE SELECTOR ────────────────────────────────────────────────────────
function LangSelect({ onSelect }) {
  const langs = [
    { code: "en", label: "English", sub: "English" },
    { code: "hi", label: "हिंदी", sub: "Hindi" },
    { code: "ta", label: "தமிழ்", sub: "Tamil" },
    { code: "te", label: "తెలుగు", sub: "Telugu" },
    { code: "kn", label: "ಕನ್ನಡ", sub: "Kannada" },
  ]
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: C.accent }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div style={{ fontWeight: 700, fontSize: 22, color: C.text }}>Property Manager</div>
          <div style={{ fontSize: 14, color: C.muted, marginTop: 6 }}>Choose your language / अपनी भाषा चुनें</div>
        </div>
        {langs.map(l => (
          <button key={l.code} onClick={() => onSelect(l.code)}
            style={{ width: "100%", padding: "16px 20px", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 16, cursor: "pointer", marginBottom: 10, textAlign: "left", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, color: C.text }}>{l.label}</div>
              <div style={{ fontSize: 13, color: C.muted }}>{l.sub}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── NOTIFICATION CARD ────────────────────────────────────────────────────────────
function NotificationCard({ tenant, lt, token }) {
  const [state, setState] = useState(null) // null while detecting
  const [working, setWorking] = useState(false)

  useEffect(() => { getPushState().then(setState) }, [])

  if (state === null || state === "unsupported" || state === "subscribed") return null

  const enable = async () => {
    setWorking(true)
    const res = await enablePush(token)
    setWorking(false)
    setState(res.ok ? "subscribed" : await getPushState())
    toast(res.ok ? "Notifications on" : "Could not enable notifications", res.ok ? "success" : "error")
  }

  let body, action = null
  if (state === "needs-install") {
    body = lt.notifInstall
  } else if (state === "denied") {
    body = lt.notifBlocked
  } else {
    body = lt.notifDesc
    action = (
      <button onClick={enable} disabled={working}
        style={{ marginTop: 12, padding: "10px 16px", background: C.accent, border: "none", borderRadius: 12, cursor: working ? "default" : "pointer", fontWeight: 700, color: "#fff", fontSize: 13, fontFamily: "inherit" }}>
        {working ? lt.notifWorking : lt.notifEnable}
      </button>
    )
  }

  return (
    <div style={{ background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.6" style={{ flexShrink: 0, marginTop: 1 }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.accent }}>{lt.notifTitle}</div>
          <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6, marginTop: 3 }}>{body}</div>
          {action}
        </div>
      </div>
    </div>
  )
}

// ── ONBOARDING ───────────────────────────────────────────────────────────────────
function OnboardingOverlay({ tenant, lt, onDone }) {
  const ob = lt.onboard
  const icons = [
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>,
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
  ]
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,26,46,0.5)", zIndex: 1000, display: "flex", alignItems: "flex-end", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: "28px 22px calc(env(safe-area-inset-bottom, 0px) + 24px)", width: "100%", maxWidth: 500, margin: "0 auto", boxShadow: "0 -8px 40px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: C.text, letterSpacing: "-0.4px" }}>{ob.welcome}, {tenant.name.split(" ")[0]}</div>
        <div style={{ fontSize: 14, color: C.muted, marginTop: 4, marginBottom: 20 }}>{ob.subtitle}</div>
        {ob.steps.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.accent, flexShrink: 0 }}>{icons[i]}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{s.t}</div>
              <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.5, marginTop: 2 }}>{s.d}</div>
            </div>
          </div>
        ))}
        <button onClick={onDone}
          style={{ width: "100%", marginTop: 10, padding: "15px", background: C.accent, border: "none", borderRadius: 14, cursor: "pointer", fontWeight: 700, color: "#fff", fontSize: 15, fontFamily: "inherit" }}>
          {ob.cta}
        </button>
      </div>
    </div>
  )
}

// ── HOME TAB ────────────────────────────────────────────────────────────────────
function HomeTab({ tenant, unit, payments, lt, setActiveTab, setPayments, token }) {
  const now = new Date()
  const unpaid = payments.filter(p => p.status === "Unpaid" && p.verification_status !== "Pending Verification")
  const overdue = unpaid.filter(p => isOverdue(p.month, p.year))
  const pending = unpaid.filter(p => !isOverdue(p.month, p.year))
  const verifying = payments.filter(p => p.verification_status === "Pending Verification")
  const overdueTotal = overdue.reduce((s, p) => s + Number(p.total_due || p.amount), 0)

  return (
    <div>
      {/* Hero */}
      <Card style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: "-0.4px" }}>{greeting(lt)}, {tenant.name.split(" ")[0]}</div>
        <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{lt.tenantSince} {fmtDate(tenant.joined_date)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
          {[[lt.monthlyRent, fmt(tenant.rent), C.accent], [lt.advancePaid, fmt(tenant.advance_amount), C.blue]].map(([l, v, color]) => (
            <div key={l} style={{ background: C.bg, borderRadius: 12, padding: "11px 12px", border: `0.5px solid ${C.border}` }}>
              <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{l}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color }}>{v}</div>
            </div>
          ))}
        </div>
      </Card>

      <NotificationCard tenant={tenant} lt={lt} token={token} />

      {/* Verifying */}
      {verifying.map(p => (
        <div key={p.id} style={{ background: C.accentSoft, border: `1.5px solid ${C.accentBorder}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: C.accent, marginBottom: 4 }}>{lt.verifying}</div>
          <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.6 }}>{lt.verifyingDesc}</div>
          <div style={{ marginTop: 10, fontSize: 14, fontWeight: 500, color: C.text }}>{MONTHS[p.month - 1]} {p.year} · {fmt(p.total_due || p.amount)}</div>
        </div>
      ))}

      {/* Overdue */}
      {overdue.length > 0 && (
        <div style={{ background: C.surface, borderRadius: 16, border: `1.5px solid ${C.accent}`, padding: 16, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: C.text }}>
                {overdue.map(p => MONTHS[p.month - 1]).join(" + ")} {overdue.length > 1 ? "overdue" : "overdue"}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{lt.overdueDesc}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: C.accent, letterSpacing: "-1px" }}>{fmt(overdueTotal)}</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {overdue.map(p => (
              <div key={p.id} style={{ background: C.bg, borderRadius: 8, padding: "5px 10px", border: `0.5px solid ${C.border}`, fontSize: 12, color: C.sub }}>
                {MONTHS[p.month - 1]}: {fmt(p.total_due || p.amount)}
                {(p.water_bill > 0 || p.electricity_bill > 0) && <span style={{ color: C.muted }}> (rent + bills)</span>}
              </div>
            ))}
          </div>
          <button onClick={() => setActiveTab("payments")}
            style={{ width: "100%", padding: "14px", background: C.accent, border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, color: "#fff", fontSize: 15, fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            {lt.payNow} · {fmt(overdueTotal)}
          </button>
        </div>
      )}

      {/* Pending */}
      {pending.map(p => (
        <div key={p.id} style={{ background: C.surface, borderRadius: 14, border: `0.5px solid ${C.border}`, padding: 14, marginBottom: 10, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: C.amberSoft, border: `0.5px solid ${C.amberBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: C.amber }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{MONTHS[p.month - 1]} {p.year}</div>
            <div style={{ fontSize: 12, color: C.muted }}>{lt.dueBy} {MONTHS[p.month % 12]} 10</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{fmt(p.total_due || p.amount)}</div>
            <Pill label={lt.pending} color={C.amber} bg={C.amberSoft} border={C.amberBorder} />
          </div>
        </div>
      ))}

      {overdue.length === 0 && pending.length === 0 && verifying.length === 0 && (
        <Card style={{ textAlign: "center", padding: 36 }}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: C.greenSoft, border: `0.5px solid ${C.greenBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: C.green }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, color: C.text }}>All paid up!</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>Your rent is up to date. Thank you!</div>
        </Card>
      )}
    </div>
  )
}

// ── PAYMENTS TAB ──────────────────────────────────────────────────────────────
function PaymentsTab({ tenant, unit, payments, setPayments, lt, token }) {
  const [paying, setPaying] = useState(null)
  const [payStep, setPayStep] = useState(0)
  const [chosenApp, setChosenApp] = useState(null)

  const UPI_APPS = [
    { name: "GPay", color: "#4285F4", icon: "G" },
    { name: "PhonePe", color: "#5f259f", icon: "P" },
    { name: "Paytm", color: "#00b9f1", icon: "₹" },
  ]

  const receipt = (p) => {
    const rows = [["Rent", p.amount]]
    if (p.water_bill > 0) rows.push(["Water", p.water_bill])
    if (p.electricity_bill > 0) rows.push(["Electricity", p.electricity_bill])
    const total = p.total_due || p.amount
    const rcptNo = `RCPT-${String(p.id).padStart(5, "0")}`
    const lines = rows.map(([l, v]) => `<tr><td style="padding:8px 0;color:#4a4a6a">${l}</td><td style="padding:8px 0;text-align:right;font-weight:600">₹${Number(v).toLocaleString("en-IN")}</td></tr>`).join("")
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${rcptNo}</title></head>
<body style="font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif;color:#1a1a2e;margin:0;padding:28px;background:#fff">
<div style="max-width:440px;margin:0 auto">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #ede9fe;padding-bottom:16px;margin-bottom:18px">
    <div><div style="font-size:20px;font-weight:800;color:#5046e5">Property Manager</div><div style="font-size:13px;color:#9090a8;margin-top:2px">Payment Receipt</div></div>
    <div style="background:#d1fae5;color:#065f46;font-weight:700;font-size:12px;padding:6px 12px;border-radius:20px">PAID</div>
  </div>
  <table style="width:100%;font-size:14px;margin-bottom:6px">
    <tr><td style="padding:4px 0;color:#9090a8">Receipt no.</td><td style="padding:4px 0;text-align:right;font-weight:600">${rcptNo}</td></tr>
    <tr><td style="padding:4px 0;color:#9090a8">Tenant</td><td style="padding:4px 0;text-align:right;font-weight:600">${tenant.name}</td></tr>
    <tr><td style="padding:4px 0;color:#9090a8">Unit</td><td style="padding:4px 0;text-align:right;font-weight:600">${unit.name}</td></tr>
    <tr><td style="padding:4px 0;color:#9090a8">Period</td><td style="padding:4px 0;text-align:right;font-weight:600">${MONTH_NAMES[p.month - 1]} ${p.year}</td></tr>
    <tr><td style="padding:4px 0;color:#9090a8">Paid on</td><td style="padding:4px 0;text-align:right;font-weight:600">${p.paid_on || "-"}</td></tr>
  </table>
  <div style="border-top:1px solid #e8e8f0;margin:14px 0"></div>
  <table style="width:100%;font-size:14px">${lines}
    <tr><td style="padding:12px 0 0;font-weight:800;font-size:16px;border-top:2px solid #1a1a2e">Total paid</td><td style="padding:12px 0 0;text-align:right;font-weight:800;font-size:16px;border-top:2px solid #1a1a2e;color:#5046e5">₹${Number(total).toLocaleString("en-IN")}</td></tr>
  </table>
  <div style="font-size:12px;color:#9090a8;margin-top:24px;line-height:1.6">This is a computer-generated receipt confirmed by your landlord. Thank you for your payment.</div>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},350)}</script>
</body></html>`
    const w = window.open("", "_blank")
    if (!w) { toast("Allow pop-ups to save the receipt", "error"); return }
    w.document.write(html); w.document.close()
  }

  const markPaid = async (payment) => {
    await supabase.rpc("tenant_mark_paid", { p_token: token, p_payment_id: payment.id })
    setPayments(ps => ps.map(p => p.id === payment.id ? { ...p, verification_status: "Pending Verification" } : p))
    setPaying(null); setPayStep(0); setChosenApp(null)
    toast("Marked as paid, awaiting confirmation")
  }

  const totalUnpaid = payments.filter(p => p.status === "Unpaid" && p.verification_status !== "Pending Verification").reduce((s, p) => s + Number(p.total_due || p.amount), 0)

  return (
    <div>
      {totalUnpaid > 0 && (
        <div style={{ background: C.redSoft, border: `0.5px solid ${C.redBorder}`, borderRadius: 14, padding: "12px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.red }}>Total outstanding</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.red }}>{fmt(totalUnpaid)}</div>
        </div>
      )}

      {[...payments].reverse().map(p => {
        const isVerifying = p.verification_status === "Pending Verification"
        const isDisputed = p.verification_status === "Disputed"
        const canPay = p.status === "Unpaid" && !isVerifying
        const od = isOverdue(p.month, p.year)

        return (
          <div key={p.id}>
            <div style={{ background: C.surface, borderRadius: 14, border: `0.5px solid ${(paying?.id === p.id) ? C.accent : od && canPay ? C.redBorder : C.border}`, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{MONTHS[p.month - 1]} {p.year}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                    {p.status === "Paid" ? `${lt.paidOn} ${p.paid_on ? fmtDate(p.paid_on) : "–"}` : `${lt.dueBy} ${MONTHS[p.month % 12]} 10`}
                  </div>
                  {isVerifying && <div style={{ fontSize: 11, color: C.accent, marginTop: 3, fontWeight: 500 }}>{lt.verifying}</div>}
                </div>
                {p.status === "Paid" ? <Pill label={lt.confirmed || lt.paid} color={C.green} bg={C.greenSoft} border={C.greenBorder} /> :
                  isVerifying ? <Pill label={lt.verifying} color={C.accent} bg={C.accentSoft} border={C.accentBorder} /> :
                  isDisputed ? <Pill label={lt.disputed} color={C.red} bg={C.redSoft} border={C.redBorder} /> :
                  od ? <Pill label={lt.overdue} color={C.red} bg={C.redSoft} border={C.redBorder} /> :
                  <Pill label={lt.pending} color={C.amber} bg={C.amberSoft} border={C.amberBorder} />}
              </div>

              {isDisputed && (
                <div style={{ background: C.redSoft, border: `0.5px solid ${C.redBorder}`, borderRadius: 10, padding: "10px 12px", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.red, marginBottom: 3 }}>{lt.disputed}</div>
                  <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>{lt.disputedDesc}</div>
                  {p.dispute_reason && (
                    <div style={{ fontSize: 12, color: C.text, marginTop: 6 }}>
                      <span style={{ color: C.muted }}>{lt.disputeReason}: </span>{p.dispute_reason}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                <div style={{ background: C.bg, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: C.sub }}>{lt.rent}: {fmt(p.amount)}</div>
                {p.water_bill > 0 && <div style={{ background: C.blueSoft, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: C.blue }}>{lt.water}: {fmt(p.water_bill)}</div>}
                {p.electricity_bill > 0 && <div style={{ background: C.amberSoft, borderRadius: 8, padding: "4px 10px", fontSize: 12, color: C.amber }}>{lt.electricity}: {fmt(p.electricity_bill)}</div>}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{fmt(p.total_due || p.amount)}</div>
                {canPay && (
                  <button onClick={() => { setPaying(p); setPayStep(0); setChosenApp(null) }}
                    style={{ padding: "9px 16px", background: C.accent, border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 700, color: "#fff", fontSize: 13, fontFamily: "inherit" }}>
                    {lt.payNow}
                  </button>
                )}
                {p.status === "Paid" && (
                  <button onClick={() => receipt(p)}
                    style={{ padding: "9px 14px", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 10, cursor: "pointer", fontWeight: 600, color: C.accent, fontSize: 13, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    {lt.receipt || "Receipt"}
                  </button>
                )}
              </div>
            </div>

            {/* Payment flow */}
            {paying?.id === p.id && (
              <div style={{ background: C.accentSoft, border: `1px solid ${C.accentBorder}`, borderRadius: 14, padding: 16, marginBottom: 12, marginTop: -4 }}>
                {payStep === 0 && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.accent, marginBottom: 14 }}>{lt.chooseApp}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                      {UPI_APPS.map(app => (
                        <button key={app.name} onClick={() => { setChosenApp(app); setPayStep(1) }}
                          style={{ padding: "14px 8px", background: C.surface, border: `0.5px solid ${C.border}`, borderRadius: 12, cursor: "pointer", fontFamily: "inherit" }}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: app.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "#fff", fontSize: 14, margin: "0 auto 6px" }}>{app.icon}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{app.name}</div>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setPaying(null)} style={{ width: "100%", marginTop: 10, padding: "11px", background: "none", border: "none", color: C.muted, fontFamily: "inherit", cursor: "pointer", fontSize: 13 }}>Cancel</button>
                  </div>
                )}

                {payStep === 1 && (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: C.accent, marginBottom: 16 }}>Pay using {chosenApp.name}</div>
                    <div style={{ background: C.surface, borderRadius: 12, padding: "14px", marginBottom: 14, border: `0.5px solid ${C.border}` }}>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>UPI ID</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: "0.02em" }}>{UPI_ID}</div>
                        <div style={{ fontSize: 13, color: C.muted }}>{UPI_NAME}</div>
                      </div>
                      <div style={{ height: "0.5px", background: C.border, marginBottom: 10 }} />
                      <div>
                        <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Amount to send</div>
                        <div style={{ fontSize: 28, fontWeight: 700, color: C.accent, letterSpacing: "-1px" }}>{fmt(p.total_due || p.amount)}</div>
                      </div>
                      <div style={{ height: "0.5px", background: C.border, margin: "10px 0" }} />
                      <div>
                        <div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>Add this note</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{lt.payNote(tenant.name, unit.name)} · {MONTHS[p.month - 1]}</div>
                      </div>
                    </div>
                    {[1,2,3,4,5].map((step, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{step}</div>
                        <div style={{ fontSize: 13, color: C.sub, paddingTop: 2, lineHeight: 1.5 }}>
                          {i === 1 ? <><strong>{UPI_ID}</strong></> : lt.paySteps[i]}
                        </div>
                      </div>
                    ))}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8, marginTop: 16 }}>
                      <a href={`upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${p.total_due || p.amount}&tn=${encodeURIComponent(lt.payNote(tenant.name, unit.name))}`}
                        style={{ padding: "14px", background: chosenApp.color, border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, color: "#fff", fontSize: 14, textDecoration: "none", textAlign: "center", display: "block" }}>
                        Open {chosenApp.name}
                      </a>
                      <button onClick={() => markPaid(p)}
                        style={{ padding: "14px", background: C.green, border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, color: "#fff", fontSize: 14, fontFamily: "inherit" }}>
                        {lt.payDone}
                      </button>
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, textAlign: "center", marginTop: 10, lineHeight: 1.6 }}>{lt.payDoneDesc}</div>
                    <button onClick={() => setPayStep(0)} style={{ width: "100%", marginTop: 8, padding: "10px", background: "none", border: "none", color: C.muted, fontFamily: "inherit", cursor: "pointer", fontSize: 13 }}>← Back</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {payments.length === 0 && (
        <Card style={{ textAlign: "center", padding: 44 }}>
          <div style={{ color: C.muted, fontSize: 14 }}>{lt.noPayments}</div>
        </Card>
      )}
    </div>
  )
}

// ── DOCUMENTS TAB ─────────────────────────────────────────────────────────────
function DocumentsTab({ tenant, unit, lt, token }) {
  const [uploading, setUploading] = useState({})
  const [uploaded, setUploaded] = useState({})
  const [agreement, setAgreement] = useState(null)

  const loadDocs = async () => {
    try {
      const r = await fetch("/api/doc-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) })
      const j = await r.json()
      if (j.ok) {
        const up = {}
        ;(j.docs || []).forEach(f => {
          const type = f.name.startsWith("aadhaar") ? "aadhaar" : f.name.startsWith("pan") ? "pan" : "other"
          if (type !== "other") up[type] = { name: f.name, url: f.url }
        })
        setUploaded(up)
        setAgreement(j.agreement || null)
      }
    } catch { /* ignore */ }
  }

  useEffect(() => { loadDocs() }, [token])

  const handleUpload = async (e, docType) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(p => ({ ...p, [docType]: true }))
    const path = `${tenant.id}/${docType}_${Date.now()}_${file.name}`
    const { data } = await supabase.storage.from("documents").upload(path, file, { upsert: true })
    if (data) {
      if (docType === "aadhaar" || docType === "pan") {
        await supabase.rpc("tenant_mark_docs_submitted", { p_token: token })
      }
      await loadDocs() // refresh signed URLs through the server
    }
    setUploading(p => ({ ...p, [docType]: false }))
  }

  const docs = [
    { key: "aadhaar", label: lt.aadhaar, desc: lt.aadhaarDesc, color: C.accent, soft: C.accentSoft, border: C.accentBorder },
    { key: "pan", label: lt.pan, desc: lt.panDesc, color: C.blue, soft: C.blueSoft, border: C.blueBorder },
  ]

  return (
    <div>
      {/* Agreement */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>{lt.agreementTitle}</div>
        {agreement ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{agreement.name}</div>
            <a href={agreement.url} target="_blank" rel="noreferrer"
              style={{ padding: "8px 14px", background: C.accentSoft, border: `0.5px solid ${C.accentBorder}`, borderRadius: 10, textDecoration: "none", fontSize: 13, color: C.accent, fontWeight: 600 }}>
              {lt.viewDoc}
            </a>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{lt.agreementDesc}</div>
        )}
      </Card>

      {docs.map(doc => (
        <Card key={doc.key} style={{ marginBottom: 12, background: uploaded[doc.key] ? C.greenSoft : C.surface, borderColor: uploaded[doc.key] ? C.greenBorder : C.border }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: uploaded[doc.key] ? C.greenSoft : doc.soft, border: `0.5px solid ${uploaded[doc.key] ? C.greenBorder : doc.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: uploaded[doc.key] ? C.green : doc.color }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: uploaded[doc.key] ? C.green : C.text }}>{doc.label}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{uploaded[doc.key] ? uploaded[doc.key].name : doc.desc}</div>
            </div>
            {uploaded[doc.key] ? (
              <a href={uploaded[doc.key].url} target="_blank" rel="noreferrer"
                style={{ padding: "7px 12px", background: C.greenSoft, border: `0.5px solid ${C.greenBorder}`, borderRadius: 10, textDecoration: "none", fontSize: 12, color: C.green, fontWeight: 600 }}>
                {lt.viewDoc}
              </a>
            ) : uploading[doc.key] ? (
              <div style={{ fontSize: 12, color: C.accent, fontWeight: 500 }}>{lt.uploading}</div>
            ) : (
              <label style={{ padding: "8px 14px", background: doc.soft, border: `0.5px solid ${doc.border}`, borderRadius: 10, cursor: "pointer", fontSize: 13, color: doc.color, fontWeight: 600 }}>
                {lt.upload}
                <input type="file" accept="image/*,.pdf" onChange={e => handleUpload(e, doc.key)} style={{ display: "none" }} />
              </label>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}

// ── ISSUES TAB ────────────────────────────────────────────────────────────────
function IssuesTab({ tenant, unit, lt, token, issues, setIssues }) {
  const [desc, setDesc] = useState("")
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const sortedIssues = (issues || []).slice().sort((a, b) => b.id - a.id)

  const handlePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const submitIssue = async () => {
    if (!desc.trim()) return
    setSubmitting(true)
    let photoUrl = null
    if (photo) {
      const path = `issues/${tenant.id}/${Date.now()}_${photo.name}`
      const { data } = await supabase.storage.from("documents").upload(path, photo)
      if (data) {
        const { data: u } = await supabase.storage.from("documents").createSignedUrl(data.path, 3600 * 24 * 7)
        photoUrl = u?.signedUrl
      }
    }
    const { data } = await supabase.rpc("tenant_report_issue", { p_token: token, p_description: desc, p_photo_url: photoUrl })
    if (data) { setIssues(p => [data, ...(p || [])]); setDesc(""); setPhoto(null); setPhotoPreview(null); setSubmitted(true); setTimeout(() => setSubmitted(false), 3000); toast("Issue reported") }
    setSubmitting(false)
  }

  return (
    <div>
      {submitted && (
        <div style={{ background: C.greenSoft, border: `0.5px solid ${C.greenBorder}`, borderRadius: 14, padding: "12px 16px", marginBottom: 14, fontSize: 14, color: C.green, fontWeight: 600 }}>
          {lt.issueSubmitted}
        </div>
      )}

      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 14 }}>{lt.reportIssue}</div>
        <Field label={lt.issueDesc}>
          <textarea style={{ ...iStyle, resize: "vertical", lineHeight: 1.6, minHeight: 80 }} rows={3} placeholder={lt.issuePlaceholder} value={desc} onChange={e => setDesc(e.target.value)} />
        </Field>
        <div style={{ marginBottom: 14 }}>
          {photoPreview ? (
            <div style={{ position: "relative" }}>
              <img src={photoPreview} alt="preview" style={{ width: "100%", borderRadius: 12, maxHeight: 160, objectFit: "cover" }} />
              <button onClick={() => { setPhoto(null); setPhotoPreview(null) }}
                style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
          ) : (
            <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", background: C.bg, border: `0.5px dashed ${C.border}`, borderRadius: 12, cursor: "pointer", fontSize: 13, color: C.muted }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {lt.addPhoto}
              <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
            </label>
          )}
        </div>
        <button onClick={submitIssue} disabled={submitting || !desc.trim()}
          style={{ width: "100%", padding: "14px", background: (!desc.trim() || submitting) ? C.bg : C.accent, border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, color: (!desc.trim() || submitting) ? C.muted : "#fff", fontSize: 14, fontFamily: "inherit" }}>
          {submitting ? lt.submitting : lt.submitIssue}
        </button>
      </Card>

      {sortedIssues.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>{lt.previousIssues}</div>
          {sortedIssues.map(r => {
            const color = r.status === "Open" ? C.red : r.status === "In Progress" ? C.amber : C.green
            const bg = r.status === "Open" ? C.redSoft : r.status === "In Progress" ? C.amberSoft : C.greenSoft
            const border = r.status === "Open" ? C.redBorder : r.status === "In Progress" ? C.amberBorder : C.greenBorder
            return (
              <Card key={r.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: C.muted }}>{fmtDate(r.submitted_at)}</div>
                  <Pill label={r.status === "In Progress" ? lt.inProgress : r.status === "Resolved" ? lt.resolved : lt.open} color={color} bg={bg} border={border} />
                </div>
                <p style={{ fontSize: 14, color: C.sub, margin: 0, lineHeight: 1.7 }}>{r.description}</p>
                {r.photo_url && <img src={r.photo_url} alt="issue" style={{ width: "100%", borderRadius: 10, marginTop: 10, maxHeight: 140, objectFit: "cover" }} />}
              </Card>
            )
          })}
        </div>
      )}

      {sortedIssues.length === 0 && !submitted && (
        <div style={{ textAlign: "center", padding: "20px 0", color: C.muted, fontSize: 13 }}>{lt.noIssues}</div>
      )}
    </div>
  )
}

// ── NOTICE TAB ────────────────────────────────────────────────────────────────
function NoticeTab({ tenant, unit, lt, payments, token, notices }) {
  const latestActive = (notices || []).slice().sort((a, b) => b.id - a.id).find(n => n.status !== "Cancelled")
  const [notice, setNotice] = useState(latestActive || null)
  const [moveOutDate, setMoveOutDate] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const outstanding = payments.filter(p => p.status === "Unpaid" && p.verification_status !== "Pending Verification").reduce((s, p) => s + Number(p.total_due || p.amount), 0)

  const submitNotice = async () => {
    if (!moveOutDate) return
    if (moveOutDate < new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]) { toast(lt.minNotice, "error"); return }
    setSubmitting(true)
    const { data, error } = await supabase.rpc("tenant_submit_notice", { p_token: token, p_move_out: moveOutDate })
    if (!error && data) { setNotice(data); toast("Notice submitted"); notifyLandlord(`${tenant.name} (Unit ${unit.name}) gave notice to vacate on ${moveOutDate}`) }
    else toast("Could not submit notice", "error")
    setSubmitting(false)
  }

  const cancelNotice = async () => {
    if (!window.confirm(lt.cancelNoticeSure)) return
    await supabase.rpc("tenant_cancel_notice", { p_token: token, p_notice_id: notice.id })
    setNotice(null)
    toast("Notice cancelled", "info")
  }

  const minDate = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]
  const settlement = Number(tenant.advance_amount) - outstanding
  const landlordPays = settlement > 0

  return (
    <div>
      {notice && notice.status !== "Cancelled" ? (
        <div>
          {notice.status === "Settled" ? (
            <Card style={{ textAlign: "center", padding: 36 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.green }}>{lt.settled}</div>
            </Card>
          ) : (
            <div>
              <div style={{ background: C.amberSoft, border: `0.5px solid ${C.amberBorder}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.amber, marginBottom: 8 }}>{lt.noticeActive}</div>
                <div style={{ fontSize: 13, color: C.sub }}>{lt.moveOutLabel}: <strong>{fmtDate(notice.move_out_date)}</strong></div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{lt.landlordNotified}</div>
                <div style={{ marginTop: 10, padding: "10px 12px", background: "#fff8ed", borderRadius: 10, fontSize: 13, color: "#92400e", lineHeight: 1.6, border: `0.5px solid ${C.amberBorder}` }}>
                  {lt.noticeCancelled.replace("Notice cancelled. ", "")}
                </div>
              </div>

              <Card style={{ marginBottom: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 12 }}>{lt.settlement}</div>
                {[[lt.advancePaidL, fmt(notice.advance_amount), C.green], [lt.outstandingDues, fmt(notice.outstanding_dues), C.red]].map(([l, v, color]) => (
                  <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `0.5px solid ${C.border}` }}>
                    <span style={{ fontSize: 14, color: C.sub }}>{l}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color }}>{v}</span>
                  </div>
                ))}
                <div style={{ marginTop: 12, padding: 14, background: notice.landlord_pays ? C.greenSoft : C.redSoft, borderRadius: 12, textAlign: "center", border: `0.5px solid ${notice.landlord_pays ? C.greenBorder : C.redBorder}` }}>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>{notice.landlord_pays ? lt.refundDesc : lt.owesDesc}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: notice.landlord_pays ? C.green : C.red }}>{fmt(notice.settlement_amount)}</div>
                </div>
              </Card>

              <button onClick={cancelNotice}
                style={{ width: "100%", padding: "14px", background: C.redSoft, border: `0.5px solid ${C.redBorder}`, borderRadius: 14, cursor: "pointer", fontWeight: 700, color: C.red, fontSize: 14, fontFamily: "inherit" }}>
                {lt.cancelNotice}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <Card style={{ marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8 }}>{lt.noticeTitle}</div>
            <div style={{ fontSize: 14, color: C.muted, marginBottom: 16, lineHeight: 1.7 }}>{lt.noticeDesc}</div>
            <Field label={lt.moveOutDate}>
              <input type="date" style={iStyle} value={moveOutDate} onChange={e => setMoveOutDate(e.target.value)} min={minDate} />
              <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>{lt.minNotice}</div>
            </Field>
            {moveOutDate && (
              <div style={{ background: C.bg, borderRadius: 12, padding: 14, marginBottom: 14, border: `0.5px solid ${C.border}` }}>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Settlement preview:</div>
                <div style={{ fontSize: 14, color: C.sub, marginBottom: 4 }}>{lt.advancePaidL}: <strong style={{ color: C.green }}>{fmt(tenant.advance_amount)}</strong></div>
                <div style={{ fontSize: 14, color: C.sub }}>{lt.outstandingDues}: <strong style={{ color: C.red }}>{fmt(outstanding)}</strong></div>
                <div style={{ marginTop: 10, padding: "10px 12px", background: landlordPays ? C.greenSoft : C.redSoft, borderRadius: 10, textAlign: "center", border: `0.5px solid ${landlordPays ? C.greenBorder : C.redBorder}` }}>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 2 }}>{landlordPays ? lt.refundDesc : lt.owesDesc}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: landlordPays ? C.green : C.red }}>{fmt(Math.abs(settlement))}</div>
                </div>
              </div>
            )}
            <button onClick={submitNotice} disabled={!moveOutDate || submitting}
              style={{ width: "100%", padding: "14px", background: (!moveOutDate || submitting) ? C.bg : C.amber, border: "none", borderRadius: 12, cursor: (!moveOutDate || submitting) ? "default" : "pointer", fontWeight: 700, color: (!moveOutDate || submitting) ? C.muted : "#fff", fontSize: 15, fontFamily: "inherit" }}>
              {submitting ? lt.submitting : lt.submitNotice}
            </button>
          </Card>
        </div>
      )}
    </div>
  )
}

// ── ROOT ────────────────────────────────────────────────────────────────────────
export default function TenantPortal({ token }) {
  const [tenant, setTenant] = useState(null)
  const [unit, setUnit] = useState(null)
  const [payments, setPayments] = useState([])
  const [notices, setNotices] = useState([])
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState("home")
  const [lang, setLang] = useState(null)
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem("pm_onboarded") === "1")

  useEffect(() => {
    const saved = localStorage.getItem("pm_lang")
    if (saved) setLang(saved)
  }, [])

  useEffect(() => {
    if (!token) { setNotFound(true); setLoading(false); return }
    // Remember this tenant so the installed PWA (which launches at "/") routes
    // back here instead of the landlord login, and point the install manifest
    // at this tenant's portal.
    localStorage.setItem("pm_tenant_token", token)
    const mlink = document.querySelector('link[rel="manifest"]')
    if (mlink) mlink.setAttribute("href", `/api/manifest?token=${token}`)

    supabase.rpc("get_tenant_portal", { p_token: token }).then(({ data }) => {
      if (!data || !data.tenant) { setNotFound(true); setLoading(false); return }
      const sortP = (data.payments || []).slice().sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
      setTenant(data.tenant)
      setUnit(data.unit)
      setPayments(sortP)
      setNotices(data.notices || [])
      setIssues(data.issues || [])
      setLoading(false)
    })
  }, [token])

  const selectLang = (code) => { localStorage.setItem("pm_lang", code); setLang(code) }
  const lt = LANGS[lang] || LANGS.en

  const overdueCount = payments.filter(p => p.status === "Unpaid" && isOverdue(p.month, p.year) && p.verification_status !== "Pending Verification").length
  const pendingCount = payments.filter(p => p.status === "Unpaid" && !isOverdue(p.month, p.year) && p.verification_status !== "Pending Verification").length
  const hasOverdue = overdueCount > 0

  if (!lang) return <LangSelect onSelect={selectLang} />
  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", padding: 16 }}>
      <style>{`@keyframes pm-shimmer{0%{opacity:.55}50%{opacity:1}100%{opacity:.55}}`}</style>
      {(() => { const sk = (h, w = "100%", mb = 12, r = 14) => <div style={{ height: h, width: w, background: C.border, borderRadius: r, marginBottom: mb, animation: "pm-shimmer 1.2s ease-in-out infinite" }} />; return (
        <>
          <div style={{ background: C.surface, borderRadius: 18, border: `0.5px solid ${C.border}`, padding: 16, marginBottom: 12 }}>
            {sk(22, "55%", 10)}{sk(13, "35%", 16, 8)}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{sk(54, "100%", 0)}{sk(54, "100%", 0)}</div>
          </div>
          {sk(120)}{sk(96)}{sk(96)}
        </>
      ) })()}
    </div>
  )
  if (notFound) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: 32, textAlign: "center" }}>
      <div style={{ fontWeight: 700, fontSize: 20, color: C.text, marginBottom: 12 }}>Portal not found</div>
      <div style={{ color: C.muted, fontSize: 14, lineHeight: 1.7 }}>This link may have expired. Please contact your landlord.</div>
    </div>
  )

  const TABS = [
    { key: "home", label: lt.tabs.home, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { key: "payments", label: lt.tabs.payments, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, badge: overdueCount + pendingCount },
    { key: "documents", label: lt.tabs.documents, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { key: "issues", label: lt.tabs.issues, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg> },
    { key: "notice", label: lt.tabs.notice, icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
  ]

  return (
    <div style={{ minHeight: "100vh", minHeight: "100dvh", background: C.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", paddingBottom: "calc(88px + env(safe-area-inset-bottom, 0px))", overscrollBehavior: "none" }}>
      {!onboarded && tenant && (
        <OnboardingOverlay tenant={tenant} lt={lt} onDone={() => { localStorage.setItem("pm_onboarded", "1"); setOnboarded(true) }} />
      )}
      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `0.5px solid ${C.border}`, paddingTop: "env(safe-area-inset-top, 18px)", padding: "env(safe-area-inset-top, 18px) 18px 14px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 500, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: C.text, letterSpacing: "-0.4px" }}>{lt.appName}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>{unit ? `${lt.unit} ${unit.name} · ${unit.floor}` : ""}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {hasOverdue && <div style={{ background: C.redSoft, border: `0.5px solid ${C.redBorder}`, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: C.red }}>{lt.overdue}</div>}
            <button onClick={() => { localStorage.removeItem("pm_lang"); setLang(null) }}
              style={{ padding: "5px 10px", borderRadius: 10, background: C.bg, border: `0.5px solid ${C.border}`, cursor: "pointer", fontSize: 11, color: C.muted, fontWeight: 600, fontFamily: "inherit" }}>
              {lang?.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 500, margin: "0 auto", padding: "18px 16px" }}>
        {activeTab === "home" && <HomeTab tenant={tenant} unit={unit} payments={payments} lt={lt} setActiveTab={setActiveTab} setPayments={setPayments} token={token} />}
        {activeTab === "payments" && <PaymentsTab tenant={tenant} unit={unit} payments={payments} setPayments={setPayments} lt={lt} token={token} />}
        {activeTab === "documents" && <DocumentsTab tenant={tenant} unit={unit} lt={lt} token={token} />}
        {activeTab === "issues" && <IssuesTab tenant={tenant} unit={unit} lt={lt} token={token} issues={issues} setIssues={setIssues} />}
        {activeTab === "notice" && <NoticeTab tenant={tenant} unit={unit} lt={lt} payments={payments} token={token} notices={notices} />}
      </div>

      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: C.surface, borderTop: `0.5px solid ${C.border}`, padding: "8px 0", paddingBottom: "max(20px, env(safe-area-inset-bottom))", zIndex: 100 }}>
        <div style={{ maxWidth: 500, margin: "0 auto", display: "flex", justifyContent: "space-around" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: activeTab === t.key ? C.accentSoft : "none", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 12, position: "relative" }}>
              <span style={{ color: activeTab === t.key ? C.accent : "#c0c0d8" }}>{t.icon}</span>
              <span style={{ fontSize: 10, fontWeight: activeTab === t.key ? 700 : 400, color: activeTab === t.key ? C.accent : C.muted }}>{t.label}</span>
              {t.badge > 0 && (
                <div style={{ position: "absolute", top: 2, right: 4, width: 16, height: 16, borderRadius: "50%", background: C.red, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
                  {t.badge}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
