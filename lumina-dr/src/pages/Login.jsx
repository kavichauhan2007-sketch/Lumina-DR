import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [role, setRole] = useState('doctor');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => { navigate('/dashboard'); }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 sm:p-8 font-sans">
      <div className="max-w-5xl w-full bg-white rounded-[24pxl] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col md:flex-row border border-slate-100">
        
        {/* LEFT SIDE - Corporate Slate Branding */}
        <div className="w-full md:w-[45%] bg-[#0f172a] p-12 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff12_1px,transparent_1px),linear-gradient(to_bottom,#ffffff12_1px,transparent_1px)] bg-size-[24px_24px]"></div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-full border border-slate-700/50 text-[10px] font-bold tracking-widest text-slate-300 mb-8 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              {isRegister ? "Provider Registration" : "Clinical Access Gateway"}
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">Lumina DR</h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Enterprise-grade tele-ophthalmology infrastructure powered by deterministic AI and secure workflows.
            </p>
          </div>
          
          <div className="relative z-10 mt-12 pt-8 border-t border-slate-800 space-y-3">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Quick Navigation</p>
            <button 
              type="button"
              onClick={() => navigate('/patient-home')} 
              className="w-full bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-between group"
            >
              <span className="flex items-center gap-3 text-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/><path d="M3 21h18"/><path d="M9 10h6"/><path d="M12 7v6"/></svg>
                Open Patient Portal
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <button 
              type="button"
              onClick={() => navigate('/about')} 
              className="w-full bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/50 text-blue-200 font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-between group"
            >
              <span className="flex items-center gap-3 text-sm">
                <span>✦</span>
                About Lumina-DR (PS-26038)
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

        {/* RIGHT SIDE - Minimalist SaaS Form */}
        <div className="w-full md:w-[55%] p-10 md:p-14 bg-white flex flex-col justify-center">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isRegister ? "Create Provider Account" : "Welcome Back"}
            </h3>
            <p className="text-sm text-slate-500 mt-1.5">
              {isRegister ? "Register your practice to access the clinical dashboard" : "Authenticate to access patient records and AI analysis"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Minimal Role Selector */}
            <div className="flex gap-4 mb-8">
              <button type="button" onClick={() => setRole('doctor')} className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${role === 'doctor' ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>
                <span className="text-sm font-semibold">Specialist</span>
              </button>
              <button type="button" onClick={() => setRole('operator')} className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${role === 'operator' ? 'border-slate-900 bg-slate-900 text-white shadow-md' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                <span className="text-sm font-semibold">Operator</span>
              </button>
            </div>

            {isRegister && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
                  <input type="text" required className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all text-sm" placeholder="Dr. First Last" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">License ID</label>
                  <input type="text" required className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all text-sm" placeholder="MED-123456" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Clinical Email ID</label>
              <input type="email" required className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all text-sm" placeholder="name@clinic.com" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                {!isRegister && <span className="text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer transition-colors">Recover?</span>}
              </div>
              <input type="password" required className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 outline-none transition-all text-sm font-medium tracking-widest" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={isLoading} className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 mt-4">
              {isLoading ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div><span className="text-sm">Authenticating...</span></>
              ) : (
                <><span className="text-sm">{isRegister ? "Initialize Account" : "Secure Authentication"}</span></>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center text-sm font-medium text-slate-500">
            {isRegister ? "Already part of the network? " : "Unregistered practice? "}
            <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-slate-900 font-bold hover:underline transition-all">
              {isRegister ? "Login here" : "Request access"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}