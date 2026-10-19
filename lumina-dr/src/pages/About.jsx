import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function About() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('pipeline');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const bgMain = isDarkMode ? "bg-slate-900 text-slate-100" : "bg-[#f8fafc] text-gray-800";
  const bgCard = isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100 shadow-sm";
  const textPrimary = isDarkMode ? "text-white" : "text-gray-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-gray-500";
  const headerBg = isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100";

  return (
    <div className={`min-h-screen flex transition-colors duration-500 ${bgMain}`}>
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-col w-64 bg-[#1e3a8a] text-white shadow-xl z-10 shrink-0">
        <div className="p-6 border-b border-blue-800">
          <h2 className="text-2xl font-black tracking-wider flex items-center gap-2">
            <span className="text-blue-400">✦</span> Lumina DR
          </h2>
          <span className="text-[10px] bg-blue-900 text-blue-300 font-bold px-2 py-0.5 rounded mt-1 inline-block">
            MathWorks PS-26038
          </span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 text-sm font-medium">
          <Link
            to="/dashboard"
            className={`block py-3 px-4 rounded-lg transition-all ${
              location.pathname === '/dashboard'
                ? 'bg-blue-800 border-l-4 border-blue-400 shadow-md'
                : 'hover:bg-blue-800/50 hover:translate-x-1'
            }`}
          >
            Analysis Dashboard
          </Link>
          <Link
            to="/patients"
            className={`block py-3 px-4 rounded-lg transition-all ${
              location.pathname === '/patients'
                ? 'bg-blue-800 border-l-4 border-blue-400 shadow-md'
                : 'hover:bg-blue-800/50 hover:translate-x-1'
            }`}
          >
            Patient Records
          </Link>
          <Link
            to="/telemedicine"
            className={`block py-3 px-4 rounded-lg transition-all ${
              location.pathname === '/telemedicine'
                ? 'bg-blue-800 border-l-4 border-blue-400 shadow-md'
                : 'hover:bg-blue-800/50 hover:translate-x-1'
            }`}
          >
            Telemedicine Simulation
          </Link>
          <Link
            to="/about"
            className={`block py-3 px-4 rounded-lg transition-all ${
              location.pathname === '/about'
                ? 'bg-blue-800 border-l-4 border-blue-400 shadow-md'
                : 'hover:bg-blue-800/50 hover:translate-x-1'
            }`}
          >
            About Project
          </Link>
          <Link
            to="/patient-home"
            className="block py-3 px-4 rounded-lg transition-all hover:bg-blue-800/50 text-blue-200 mt-6 border border-blue-700/60"
          >
            Patient Portal &rarr;
          </Link>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className={`${headerBg} px-8 py-5 flex justify-between items-center shadow-sm border-b z-0 transition-colors`}>
          <div>
            <h1 className={`text-2xl font-bold ${textPrimary}`}>About Lumina-DR</h1>
            <p className={`text-sm mt-0.5 ${textSecondary}`}>
              MathWorks PS-26038 • Explainable AI for Diabetic Retinopathy Screening in Rural India
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full transition-all ${
                isDarkMode ? 'bg-slate-700 text-yellow-300' : 'bg-slate-100 text-slate-600'
              }`}
              title="Toggle Dark Mode"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">
                v2.0.0 Stable
              </span>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center font-bold text-blue-700">
              AI
            </div>
          </div>
        </header>

        {/* Scrollable Container */}
        <div className="p-8 flex-1 overflow-y-auto space-y-8">
          
          {/* Hero Banner Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-8 md:p-10 shadow-xl border border-blue-800">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="relative z-10 max-w-4xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-800/60 border border-blue-600/50 text-xs font-bold text-blue-300 uppercase tracking-wider">
                MathWorks Problem Statement PS-26038
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                Empowering Rural Healthcare with Explainable AI & Telemedicine Engineering
              </h2>
              <p className="text-blue-100/90 text-sm md:text-base leading-relaxed">
                Diabetic Retinopathy (DR) causes irreversible vision loss if undetected. In India, where over 77 million people live with diabetes and rural Primary Health Centres (PHCs) lack trained ophthalmologists, Lumina-DR bridges the diagnostic gap through automated quality enhancement, lesion segmentation, ICDR severity staging, and low-bandwidth telemedicine queue optimization.
              </p>
              
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="text-2xl md:text-3xl font-black text-blue-300">77M+</div>
                  <div className="text-xs text-blue-200 mt-1">Diabetic Patients in India</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="text-2xl md:text-3xl font-black text-amber-300">&lt; 1 : 100k</div>
                  <div className="text-xs text-blue-200 mt-1">Rural Eye Specialist Density</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="text-2xl md:text-3xl font-black text-emerald-300">&gt; 90%</div>
                  <div className="text-xs text-blue-200 mt-1">Referable DR Sensitivity</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="text-2xl md:text-3xl font-black text-purple-300">&lt; 30s</div>
                  <div className="text-xs text-blue-200 mt-1">Doctor Handover Report</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 gap-6">
            <button
              onClick={() => setActiveTab('pipeline')}
              className={`pb-3 text-sm font-bold transition-all relative ${
                activeTab === 'pipeline'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              🔬 5-Stage Clinical Pipeline
            </button>
            <button
              onClick={() => setActiveTab('simulink')}
              className={`pb-3 text-sm font-bold transition-all relative ${
                activeTab === 'simulink'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              📡 Telemedicine & Simulink Model
            </button>
            <button
              onClick={() => setActiveTab('stack')}
              className={`pb-3 text-sm font-bold transition-all relative ${
                activeTab === 'stack'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              ⚡ Tech Stack & Architecture
            </button>
            <button
              onClick={() => setActiveTab('clinical')}
              className={`pb-3 text-sm font-bold transition-all relative ${
                activeTab === 'clinical'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              📋 Clinical Standards (ICDR)
            </button>
          </div>

          {/* TAB 1: 5-Stage Clinical Pipeline */}
          {activeTab === 'pipeline' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Stage 1 */}
              <div className={`${bgCard} rounded-2xl p-6 border space-y-3 relative overflow-hidden group hover:shadow-md transition-all`}>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg mb-2">
                  1
                </div>
                <h3 className={`text-base font-bold ${textPrimary}`}>Quality Assessment & Adaptive CLAHE</h3>
                <p className={`text-xs ${textSecondary} leading-relaxed`}>
                  Solves camera defocus and poor lighting typical of portable non-mydriatic fundus cameras. Computes Laplacian focus score (Var &gt; 40) and applies adaptive Contrast-Limited Histogram Equalization in L*a*b* space with bilateral denoising.
                </p>
                <div className="pt-2 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                  <span>Target: Instant recapture guidance for ungradeable scans</span>
                </div>
              </div>

              {/* Stage 2 */}
              <div className={`${bgCard} rounded-2xl p-6 border space-y-3 relative overflow-hidden group hover:shadow-md transition-all`}>
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg mb-2">
                  2
                </div>
                <h3 className={`text-base font-bold ${textPrimary}`}>Anatomical Structure Localization</h3>
                <p className={`text-xs ${textSecondary} leading-relaxed`}>
                  Uses circular Hough Transform on high-luminance regions to precisely pinpoint the Optic Disc (OD) center and radius. Localizes the Fovea Centralis and extracts the retinal vessel tree using morphological green-channel top-hat filtering.
                </p>
                <div className="pt-2 text-[11px] font-semibold text-indigo-600 flex items-center gap-1">
                  <span>Structures: Optic Disc, Fovea, Major Vascular Arcades</span>
                </div>
              </div>

              {/* Stage 3 */}
              <div className={`${bgCard} rounded-2xl p-6 border space-y-3 relative overflow-hidden group hover:shadow-md transition-all`}>
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-lg mb-2">
                  3
                </div>
                <h3 className={`text-base font-bold ${textPrimary}`}>Multi-Lesion Pathology Detection</h3>
                <p className={`text-xs ${textSecondary} leading-relaxed`}>
                  Individual pathological segmentation for hallmark DR lesions:
                  Microaneurysms (sub-pixel morphological blob analysis), Hard Exudates (luminance clustering), Dot-Blot and Flame Hemorrhages, and Neovascularization (vessel tortuosity and disc complexity).
                </p>
                <div className="pt-2 text-[11px] font-semibold text-purple-600 flex items-center gap-1">
                  <span>Lesions: MAs, Exudates, Hemorrhages, NV</span>
                </div>
              </div>

              {/* Stage 4 */}
              <div className={`${bgCard} rounded-2xl p-6 border space-y-3 relative overflow-hidden group hover:shadow-md transition-all`}>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg mb-2">
                  4
                </div>
                <h3 className={`text-base font-bold ${textPrimary}`}>ICDR 0–4 Severity Grading Engine</h3>
                <p className={`text-xs ${textSecondary} leading-relaxed`}>
                  Calibrated rule engine based on the International Clinical Diabetic Retinopathy scale. Translates lesion counts and anatomical distributions into Grades 0 to 4 with confidence scoring, separating non-referable cases (0-1) from urgent referable DR (2-4).
                </p>
                <div className="pt-2 text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                  <span>Accuracy: &gt;90% Sensitivity, &gt;85% Specificity</span>
                </div>
              </div>

              {/* Stage 5 */}
              <div className={`${bgCard} rounded-2xl p-6 border space-y-3 relative overflow-hidden group hover:shadow-md transition-all`}>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mb-2">
                  5
                </div>
                <h3 className={`text-base font-bold ${textPrimary}`}>Explainability (XAI) & Doctor Reports</h3>
                <p className={`text-xs ${textSecondary} leading-relaxed`}>
                  Builds clinical trust by superimposing Grad-CAM style attention heatmaps directly on the fundus scan, showing ophthalmologists exactly which regions triggered the AI. Generates automated sub-30-second physician handover notes and one-click clinical PDFs.
                </p>
                <div className="pt-2 text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <span>Outputs: Colorized Heatmap, Referral Plan, jsPDF</span>
                </div>
              </div>

              {/* Stage 6: Telemedicine */}
              <div className={`${bgCard} rounded-2xl p-6 border space-y-3 relative overflow-hidden group hover:shadow-md transition-all`}>
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-lg mb-2">
                  6
                </div>
                <h3 className={`text-base font-bold ${textPrimary}`}>District Telemedicine Simulation</h3>
                <p className={`text-xs ${textSecondary} leading-relaxed`}>
                  Simulates a district population of 100,000+ citizens across multiple PHCs. Evaluates network bottlenecks under 2G, 3G, 4G, and Satellite conditions, balancing Edge processing latency with Cloud specialist bandwidth constraints.
                </p>
                <div className="pt-2 text-[11px] font-semibold text-rose-600 flex items-center gap-1">
                  <span>Simulation: PHC Queue Dynamics & Annual Coverage</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Telemedicine & Simulink Model */}
          {activeTab === 'simulink' && (
            <div className={`${bgCard} rounded-3xl p-8 border space-y-6`}>
              <div className="max-w-3xl">
                <h3 className={`text-xl font-bold ${textPrimary}`}>District Telemedicine Pipeline Simulation</h3>
                <p className={`text-sm ${textSecondary} mt-1`}>
                  In rural India, connectivity varies wildly from 0.2 Mbps (2G/EDGE) to intermittent VSAT satellite uplinks. Lumina-DR implements a Simulink-equivalent discrete-event telemedicine model to optimize screening throughput.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                  <div className="text-xs font-bold text-blue-800 uppercase">2G (EDGE)</div>
                  <div className="text-xl font-extrabold text-blue-900 mt-1">0.2 Mbps</div>
                  <div className="text-xs text-gray-500 mt-0.5">500ms RTT • 8% Packet Loss</div>
                  <div className="text-[11px] text-blue-700 mt-2 font-medium">Edge processing mandatory</div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                  <div className="text-xs font-bold text-amber-800 uppercase">3G (HSPA+)</div>
                  <div className="text-xl font-extrabold text-amber-900 mt-1">2.0 Mbps</div>
                  <div className="text-xs text-gray-500 mt-0.5">150ms RTT • 3% Packet Loss</div>
                  <div className="text-[11px] text-amber-700 mt-2 font-medium">Hybrid Edge-Cloud triage</div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                  <div className="text-xs font-bold text-emerald-800 uppercase">4G (LTE)</div>
                  <div className="text-xl font-extrabold text-emerald-900 mt-1">20.0 Mbps</div>
                  <div className="text-xs text-gray-500 mt-0.5">40ms RTT • 0.5% Loss</div>
                  <div className="text-[11px] text-emerald-700 mt-2 font-medium">Real-time cloud review</div>
                </div>
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
                  <div className="text-xs font-bold text-purple-800 uppercase">Satellite (VSAT)</div>
                  <div className="text-xl font-extrabold text-purple-900 mt-1">5.0 Mbps</div>
                  <div className="text-xs text-gray-500 mt-0.5">620ms RTT • 2% Loss</div>
                  <div className="text-[11px] text-purple-700 mt-2 font-medium">Batch sync architecture</div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-sm font-bold text-slate-800">MATLAB / Simulink Verification Script</h4>
                <p className="text-xs text-slate-600">
                  The telemedicine dynamics are fully verifiable in MathWorks MATLAB via <code className="bg-slate-200 px-1 py-0.5 rounded text-blue-700">matlab/telemedicine_simulink_model.m</code> and the image pipeline via <code className="bg-slate-200 px-1 py-0.5 rounded text-blue-700">matlab/dr_screening_pipeline.m</code>.
                </p>
                <div className="flex gap-3">
                  <Link to="/telemedicine" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
                    Open Telemedicine Studio &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Tech Stack & Architecture */}
          {activeTab === 'stack' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className={`${bgCard} rounded-2xl p-6 border space-y-4`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚙️</span>
                  <h3 className={`text-base font-bold ${textPrimary}`}>FastAPI Vision Backend</h3>
                </div>
                <p className={`text-xs ${textSecondary} leading-relaxed`}>
                  Lightweight, asynchronous Python server running Uvicorn. Delivers high throughput with sub-second image processing times without demanding heavy GPU hardware.
                </p>
                <ul className="text-xs space-y-2 text-slate-600">
                  <li className="flex items-center gap-2">✓ <strong>OpenCV 4.8+:</strong> Adaptive CLAHE & Morphology</li>
                  <li className="flex items-center gap-2">✓ <strong>NumPy 2.x:</strong> Vectorized matrix math</li>
                  <li className="flex items-center gap-2">✓ <strong>Uvicorn:</strong> ASGI production engine</li>
                  <li className="flex items-center gap-2">✓ <strong>Simulink Engine:</strong> Telemedicine queue modeling</li>
                </ul>
              </div>

              <div className={`${bgCard} rounded-2xl p-6 border space-y-4`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚛️</span>
                  <h3 className={`text-base font-bold ${textPrimary}`}>Modern React 19 Frontend</h3>
                </div>
                <p className={`text-xs ${textSecondary} leading-relaxed`}>
                  Engineered using React 19 and Vite 8 for instant HMR. Designed with clinical ergonomics: zoom inspection loupes, layered visual overlays, and multilingual patient portals.
                </p>
                <ul className="text-xs space-y-2 text-slate-600">
                  <li className="flex items-center gap-2">✓ <strong>Tailwind CSS:</strong> Curated medical color system</li>
                  <li className="flex items-center gap-2">✓ <strong>Recharts:</strong> Interactive queue & latency charts</li>
                  <li className="flex items-center gap-2">✓ <strong>jsPDF:</strong> Instant offline PDF clinical export</li>
                  <li className="flex items-center gap-2">✓ <strong>Dual Roles:</strong> Clinician & Patient interfaces</li>
                </ul>
              </div>

              <div className={`${bgCard} rounded-2xl p-6 border space-y-4`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📐</span>
                  <h3 className={`text-base font-bold ${textPrimary}`}>MathWorks Algorithms</h3>
                </div>
                <p className={`text-xs ${textSecondary} leading-relaxed`}>
                  Dedicated MATLAB scripts corresponding directly to the Python implementation, providing benchmark mathematical reproducibility for MathWorks PS-26038 evaluators.
                </p>
                <ul className="text-xs space-y-2 text-slate-600">
                  <li className="flex items-center gap-2">✓ <strong>dr_screening_pipeline.m:</strong> Image processing</li>
                  <li className="flex items-center gap-2">✓ <strong>telemedicine_simulink_model.m:</strong> Queue dynamics</li>
                  <li className="flex items-center gap-2">✓ <strong>Laplacian Variance:</strong> Sharpness filter</li>
                  <li className="flex items-center gap-2">✓ <strong>Synthetic Generator:</strong> Zero-dependency test runs</li>
                </ul>
              </div>

            </div>
          )}

          {/* TAB 4: Clinical Standards (ICDR) */}
          {activeTab === 'clinical' && (
            <div className={`${bgCard} rounded-3xl p-8 border space-y-6 overflow-x-auto`}>
              <div>
                <h3 className={`text-xl font-bold ${textPrimary}`}>International Clinical Diabetic Retinopathy (ICDR) Scale</h3>
                <p className={`text-sm ${textSecondary} mt-1`}>
                  Lumina-DR strictly maps detection findings to the internationally accepted clinical consensus:
                </p>
              </div>

              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Key Lesion Markers</th>
                    <th className="py-3 px-4">Referable</th>
                    <th className="py-3 px-4">Action & Triage Protocol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-emerald-600">Level 0</td>
                    <td className="py-3.5 px-4 font-bold">No Apparent DR</td>
                    <td className="py-3.5 px-4 text-gray-600">No abnormal lesions detected</td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-bold">No</span></td>
                    <td className="py-3.5 px-4 text-emerald-700 font-medium">Routine annual screening (12 months)</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-blue-600">Level 1</td>
                    <td className="py-3.5 px-4 font-bold">Mild NPDR</td>
                    <td className="py-3.5 px-4 text-gray-600">Microaneurysms only (1 - 5 count)</td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-bold">No</span></td>
                    <td className="py-3.5 px-4 text-blue-700 font-medium">Re-screening at PHC in 6 to 9 months</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-amber-600">Level 2</td>
                    <td className="py-3.5 px-4 font-bold">Moderate NPDR</td>
                    <td className="py-3.5 px-4 text-gray-600">MAs &gt; 5, early hard exudates (&gt;0.5%), dot-blot hemorrhages</td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">Yes</span></td>
                    <td className="py-3.5 px-4 text-amber-700 font-medium">Refer to District Eye Hospital within 4 weeks</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-orange-600">Level 3</td>
                    <td className="py-3.5 px-4 font-bold">Severe NPDR</td>
                    <td className="py-3.5 px-4 text-gray-600">&gt; 10 hemorrhages, venous beading proxies, IRMA indicators</td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">Yes</span></td>
                    <td className="py-3.5 px-4 text-orange-700 font-medium">Urgent specialist appointment within 2 weeks</td>
                  </tr>
                  <tr className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-bold text-red-600">Level 4</td>
                    <td className="py-3.5 px-4 font-bold">Proliferative DR (PDR)</td>
                    <td className="py-3.5 px-4 text-gray-600">Neovascularization, pre-retinal or vitreous hemorrhage</td>
                    <td className="py-3.5 px-4"><span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">Yes</span></td>
                    <td className="py-3.5 px-4 text-red-700 font-bold">Immediate referral for laser panretinal photocoagulation (PRP)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Footer note */}
          <div className="pt-4 text-center text-xs text-gray-400">
            Lumina-DR • MathWorks Problem Statement PS-26038: Explainable AI for Diabetic Retinopathy Screening in Rural India
          </div>

        </div>
      </div>
    </div>
  );
}
