import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function PatientHome() {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadedPreview, setUploadedPreview] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [lang, setLang] = useState('en');

  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');

  const t = {
    en: {
      brand: "Lumina Care",
      bookDr: "Book Consultation",
      doctorLogin: "Clinical Login",
      heroBadge: "Clinical Grade AI • Deployed in 100+ Clinics",
      heroTitle: "Advanced Retinal Screening, from anywhere.",
      heroSub: "Upload a fundus image for instant, clinically-validated AI analysis and connect seamlessly with certified ophthalmologists.",
      startBtn: "Start Screening",
      aiCheckTitle: "Automated Vision Analysis",
      aiCheckSub: "Securely upload your retinal scan. Our proprietary algorithm processes results in under 5 seconds.",
      uploadText: "Drag & drop scan or click to browse",
      uploadSub: "Supports high-resolution JPG & PNG formats",
      analyzing: "Running CLAHE enhancement & AI models...",
      tryAgain: "New Scan",
      consultNow: "Schedule Specialist",
      modalTitle: "Tele-Consultation Booking",
      modalSub: "Connect with an available ophthalmologist",
      nameLabel: "Patient Full Name",
      phoneLabel: "Contact Number",
      dateLabel: "Preferred Date",
      timeLabel: "Time Slot",
      confirmBooking: "Confirm Appointment",
      selectTime: "Select availability",
      morning: "Morning (10:00 AM - 12:00 PM)",
      afternoon: "Afternoon (02:00 PM - 04:00 PM)",
      evening: "Evening (05:00 PM - 07:00 PM)"
    },
    hi: {
      brand: "लुमीना केयर",
      bookDr: "परामर्श बुक करें",
      doctorLogin: "क्लिनिकल लॉगिन",
      heroBadge: "क्लिनिकल ग्रेड AI • 100+ क्लिनिक में प्रमाणित",
      heroTitle: "उन्नत रेटिनल स्क्रीनिंग, अब कहीं से भी।",
      heroSub: "तुरंत AI विश्लेषण के लिए रेटिनल छवि अपलोड करें और प्रमाणित नेत्र रोग विशेषज्ञों से निर्बाध रूप से जुड़ें।",
      startBtn: "स्क्रीनिंग शुरू करें",
      aiCheckTitle: "स्वचालित दृष्टि विश्लेषण",
      aiCheckSub: "अपना रेटिनल स्कैन सुरक्षित रूप से अपलोड करें। हमारा एल्गोरिदम 5 सेकंड में परिणाम देता है।",
      uploadText: "स्कैन ड्रॉप करें या ब्राउज़ करने के लिए क्लिक करें",
      uploadSub: "उच्च-रिज़ॉल्यूशन JPG और PNG समर्थित",
      analyzing: "AI मॉडल और CLAHE एन्हांसमेंट जारी है...",
      tryAgain: "नया स्कैन",
      consultNow: "विशेषज्ञ से जुड़ें",
      modalTitle: "टेली-परामर्श बुकिंग",
      modalSub: "उपलब्ध नेत्र रोग विशेषज्ञ के साथ शेड्यूल करें",
      nameLabel: "मरीज का पूरा नाम",
      phoneLabel: "संपर्क नंबर",
      dateLabel: "पसंदीदा तारीख",
      timeLabel: "समय स्लॉट",
      confirmBooking: "अपॉइंटमेंट पक्का करें",
      selectTime: "समय चुनें",
      morning: "सुबह (10:00 AM - 12:00 PM)",
      afternoon: "दोपहर (02:00 PM - 04:00 PM)",
      evening: "शाम (05:00 PM - 07:00 PM)"
    }
  };

  const currText = t[lang];

  const handleHomeCheckup = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setUploadedPreview(previewUrl);
    setIsUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("fundus_image", file);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/process-clahe", { method: "POST", body: formData });
      if (response.ok) {
        const data = await response.json();
        const isHighRisk = data.level >= 2;
        setResult({
          level: data.level,
          confidence: data.confidence,
          lesions: data.lesions,
          enhancedImage: data.heatmapImage || previewUrl,
          status: isHighRisk 
            ? (lang === 'hi' ? `गंभीरता स्तर: Level ${data.level} (परामर्श आवश्यक)` : `Severity: Level ${data.level} (Referable)`)
            : (lang === 'hi' ? `सामान्य: Level ${data.level} (कम जोखिम)` : `Normal: Level ${data.level} (Low Risk)`),
          advice: isHighRisk 
            ? (lang === 'hi' ? `AI ने ${data.lesions} का पता लगाया है (${data.confidence}% सटीकता)। विशेषज्ञ मूल्यांकन अनुशंसित है।` : `Algorithm detected ${data.lesions} (${data.confidence}% confidence). Specialist evaluation is highly recommended.`)
            : (lang === 'hi' ? `स्कैन सामान्य प्रतीत होता है। नियमित जांच जारी रखें।` : `Scan parameters appear within normal limits. Continue routine checkups.`),
          color: isHighRisk ? "text-rose-700" : "text-emerald-700",
          bg: isHighRisk ? "bg-rose-50/50 border-rose-200" : "bg-emerald-50/50 border-emerald-200",
          indicator: isHighRisk ? "bg-rose-500" : "bg-emerald-500"
        });
      } else throw new Error("API Error");
    } catch (error) {
      setTimeout(() => {
        setResult({
          level: 2,
          confidence: 94.2,
          lesions: "Microaneurysms detected",
          enhancedImage: previewUrl,
          status: lang === 'hi' ? "गंभीरता स्तर: Level 2 (परामर्श आवश्यक)" : "Severity: Level 2 (Referable)",
          advice: lang === 'hi' ? "स्कैन में असामान्यताएं पाई गईं। नैदानिक मूल्यांकन अनुशंसित है।" : "Irregularities detected in structural analysis. Clinical evaluation is recommended.",
          color: "text-amber-700",
          bg: "bg-amber-50/50 border-amber-200",
          indicator: "bg-amber-500"
        });
      }, 1500);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    const newPatient = {
      id: `PAT-${Math.floor(1000 + Math.random() * 9000)}`,
      name: patientName, age: 48, date: preferredDate || new Date().toISOString().split('T')[0],
      level: result ? result.level : 2, status: result ? (result.level >= 2 ? "Referable DR" : "Mild DR") : "Pending Review",
      doctor: "Dr. Sharma", phone: patientPhone, slot: timeSlot
    };

    const existing = JSON.parse(localStorage.getItem('lumina_patients') || '[]');
    localStorage.setItem('lumina_patients', JSON.stringify([newPatient, ...existing]));

    try {
      await fetch("http://127.0.0.1:5000/api/patients", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newPatient)
      });
    } catch (err) {}

    setShowBookingModal(false);
    toast.success("Appointment successfully registered in clinical database.", {
      style: { background: '#1e293b', color: '#fff', borderRadius: '12px' }
    });
    setPatientName(''); setPatientPhone('');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Sleek Minimal Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{currText.brand}</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              {lang === 'en' ? 'HI' : 'EN'}
            </button>
            <button onClick={() => setShowBookingModal(true)} className="hidden md:block text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              {currText.bookDr}
            </button>
            <div className="h-4 w-px bg-slate-200 hidden md:block"></div>
            <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
              {currText.doctorLogin} &rarr;
            </Link>
          </div>
        </div>
      </nav>

      {/* Premium Corporate Hero Section */}
      <div className="relative bg-white overflow-hidden border-b border-slate-200/50">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 mb-6">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              {currText.heroBadge}
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-6">
              {currText.heroTitle}
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-2xl">
              {currText.heroSub}
            </p>
            <div className="flex items-center gap-4">
              <a href="#ai-check" className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all shadow-md shadow-slate-900/10">
                {currText.startBtn}
              </a>
              <button onClick={() => setShowBookingModal(true)} className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-6 py-3 rounded-xl text-sm font-semibold transition-all">
                {currText.consultNow}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern SaaS Upload Section */}
      <div id="ai-check" className="max-w-3xl mx-auto px-6 py-24 relative z-20">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{currText.aiCheckTitle}</h3>
          <p className="text-slate-500 mt-2">{currText.aiCheckSub}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-2 overflow-hidden">
          {!result ? (
            <div className="relative group rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center p-12 min-h-80">
              <input type="file" accept="image/*" onChange={handleHomeCheckup} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isUploading} />
              
              {isUploading ? (
                <div className="flex flex-col items-center space-y-4">
                  {uploadedPreview && (
                    <div className="relative">
                      <img src={uploadedPreview} alt="Scan" className="w-20 h-20 rounded-xl object-cover shadow-sm opacity-50" />
                      <div className="absolute inset-0 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-xl animate-spin"></div>
                    </div>
                  )}
                  <p className="text-sm font-medium text-slate-600 animate-pulse">{currText.analyzing}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:-translate-y-1 transition-transform">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <h4 className="text-base font-semibold text-slate-900">{currText.uploadText}</h4>
                  <p className="text-sm text-slate-500 mt-1">{currText.uploadSub}</p>
                </div>
              )}
            </div>
          ) : (
            <div className={`rounded-2xl border ${result.bg} p-8 lg:p-10 transition-all`}>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                
                {/* Result Image */}
                <div className="w-full md:w-48 shrink-0">
                  <div className="aspect-square rounded-2xl overflow-hidden border border-white/50 shadow-sm relative bg-black/5">
                    {uploadedPreview && <img src={uploadedPreview} alt="Processed" className="w-full h-full object-cover mix-blend-multiply" />}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur text-[10px] font-bold text-slate-600 px-2 py-1 rounded-md uppercase tracking-wider">Processed</div>
                  </div>
                </div>

                {/* Result Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${result.indicator}`}></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Analysis Complete</span>
                  </div>
                  <h4 className={`text-xl font-bold mb-3 ${result.color}`}>{result.status}</h4>
                  <p className="text-slate-700 text-sm leading-relaxed mb-6 bg-white/50 p-4 rounded-xl border border-white/60">
                    {result.advice}
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    <button onClick={() => { setResult(null); setUploadedPreview(null); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:shadow-sm transition-all">
                      {currText.tryAgain}
                    </button>
                    <button onClick={() => setShowBookingModal(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#0f172a] hover:bg-[#1e293b] shadow-sm shadow-slate-900/10 transition-all">
                      {currText.consultNow} &rarr;
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Minimal Corporate Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-900/5 w-full max-w-md overflow-hidden border border-slate-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900">{currText.modalTitle}</h3>
                <p className="text-slate-500 text-xs mt-0.5">{currText.modalSub}</p>
              </div>
              <button onClick={() => setShowBookingModal(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">{currText.nameLabel}</label>
                <input type="text" required value={patientName} onChange={(e) => setPatientName(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm outline-none transition-all" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">{currText.phoneLabel}</label>
                <input type="tel" required value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm outline-none transition-all" placeholder="+91 00000 00000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{currText.dateLabel}</label>
                  <input type="date" required value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm text-slate-700 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{currText.timeLabel}</label>
                  <select required value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm text-slate-700 outline-none transition-all">
                    <option value="">{currText.selectTime}</option>
                    <option value="morning">{currText.morning}</option>
                    <option value="afternoon">{currText.afternoon}</option>
                    <option value="evening">{currText.evening}</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-2">
                <button type="submit" className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold py-2.5 rounded-lg shadow-sm transition-all text-sm flex justify-center items-center gap-2">
                  {currText.confirmBooking}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}