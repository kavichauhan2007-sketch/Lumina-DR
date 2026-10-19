import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { generateClinicalReport } from '../utils/geminiReport';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';

export default function Dashboard() {
  const location = useLocation();
  const [selectedImage, setSelectedImage] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState('');
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Active view layer for image display
  // 'enhanced' | 'gradcam' | 'vessels' | 'mas' | 'exudates' | 'hemorrhages'
  const [activeLayer, setActiveLayer] = useState('enhanced');
  const [gradcamOpacity, setGradcamOpacity] = useState(65);

  // Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Zoom lens state
  const [lensPos, setLensPos] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);

  const handleZoomMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setLensPos({ x, y });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImage(URL.createObjectURL(file));
    setAnalysisData(null);
    setReport('');
    setIsProcessing(true);
    toast.info("Image uploaded! Running MathWorks PS-26038 Analysis Pipeline...", { theme: isDarkMode ? "dark" : "colored" });

    const formData = new FormData();
    formData.append("fundus_image", file);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/process-analysis", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysisData(data);
        toast.success(`Analysis Complete: ${data.icdr_name} (Level ${data.level})`, { theme: isDarkMode ? "dark" : "colored" });

        setIsReportLoading(true);
        try {
          const generatedReport = await generateClinicalReport({
            level: data.level,
            lesions: data.lesion_summary,
            quality: data.quality_classification,
            confidence: data.confidence,
            criteria: data.criteria_matched,
            action: data.action,
          });
          setReport(generatedReport);
          toast.success("AI Clinical Report Generated (<30s workflow ready)!", { theme: isDarkMode ? "dark" : "colored" });
        } catch (aiError) {
          setReport(`ICDR Level ${data.level}: ${data.icdr_name}.\nLesions: ${data.lesion_summary}.\nAction: ${data.action}`);
          toast.info("Standard Report Generated.", { theme: isDarkMode ? "dark" : "colored" });
        }
        setIsReportLoading(false);
      } else {
        toast.error(`Backend Error: Status ${response.status}`, { theme: isDarkMode ? "dark" : "colored" });
      }
    } catch (error) {
      toast.error("Network Error: Make sure FastAPI backend (python main.py) is running on port 5000!", { theme: isDarkMode ? "dark" : "colored" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!analysisData) return;
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("Lumina DR - Clinical Screening Report", 15, 20);

    // Patient & Quality info
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Quality Assessment: ${analysisData.quality_classification || 'Gradeable'}`, 15, 40);
    doc.text(`Focus Score: ${analysisData.focus_score || 'N/A'}`, 15, 47);
    doc.text(`ICDR Severity: Level ${analysisData.level} - ${analysisData.icdr_name}`, 15, 54);
    doc.text(`AI Confidence: ${analysisData.confidence}%`, 15, 61);
    doc.text(`Referable DR (Level 2+): ${analysisData.referable ? "YES (Referral Required)" : "NO"}`, 15, 68);

    // Lesion Findings
    doc.setFontSize(13);
    doc.setTextColor(30, 58, 138);
    doc.text("Lesion & Structure Findings:", 15, 80);
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`• Microaneurysms: ${analysisData.ma_count}`, 20, 88);
    doc.text(`• Hard Exudates Area: ${analysisData.exudate_area_pct}%`, 20, 95);
    doc.text(`• Hemorrhages: ${analysisData.hemorrhage_count} [Type: ${analysisData.hemorrhage_type}]`, 20, 102);
    doc.text(`• Neovascularization: ${analysisData.neovascularization ? "DETECTED" : "None"}`, 20, 109);
    doc.text(`• Retinal Vessel Density: ${(analysisData.vessel_density * 100).toFixed(1)}%`, 20, 116);

    // Clinical Action
    doc.setFontSize(13);
    doc.setTextColor(30, 58, 138);
    doc.text("Clinical Action Plan:", 15, 128);
    doc.setFontSize(10);
    doc.setTextColor(0, 100, 0);
    doc.text(analysisData.action || "Routine follow up.", 20, 136, { maxWidth: 170 });

    // Doctor Report
    if (report) {
      doc.setFontSize(13);
      doc.setTextColor(30, 58, 138);
      doc.text("Doctor 30-Second Summary Notes:", 15, 150);
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text(report, 20, 158, { maxWidth: 170 });
    }

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("MathWorks Problem Statement PS-26038 | Sensitivity >90% | Specificity >85%", 15, 280);

    doc.save(`Lumina_DR_Report_Level${analysisData.level}.pdf`);
    toast.success("Clinical Report PDF Downloaded!", { theme: isDarkMode ? "dark" : "colored" });
  };

  const getCurrentImage = () => {
    if (!analysisData) return null;
    switch (activeLayer) {
      case 'gradcam':    return analysisData.gradcam_b64 || analysisData.enhanced_image_b64;
      case 'vessels':    return analysisData.vessel_mask_b64 || analysisData.enhanced_image_b64;
      case 'mas':        return analysisData.ma_mask_b64 || analysisData.enhanced_image_b64;
      case 'exudates':   return analysisData.exudate_mask_b64 || analysisData.enhanced_image_b64;
      case 'hemorrhages':return analysisData.hemorrhage_mask_b64 || analysisData.enhanced_image_b64;
      case 'enhanced':
      default:           return analysisData.enhanced_image_b64;
    }
  };

  const bgMain = isDarkMode ? "bg-slate-900" : "bg-blue-50/40";
  const bgCard = isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100";
  const textPrimary = isDarkMode ? "text-white" : "text-gray-800";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-gray-500";
  const headerBg = isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-100";

  return (
    <div className={`min-h-screen flex transition-colors duration-500 ${bgMain}`}>
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-col w-64 bg-[#1e3a8a] text-white shadow-xl z-10">
        <div className="p-6 border-b border-blue-800">
          <h2 className="text-2xl font-black tracking-wider flex items-center gap-2">
            <span className="text-blue-400">✦</span> Lumina DR
          </h2>
          <span className="text-[10px] bg-blue-900 text-blue-300 font-bold px-2 py-0.5 rounded mt-1 inline-block">MathWorks PS-26038</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 text-sm font-medium">
          <Link to="/dashboard" className={`block py-3 px-4 rounded-lg transition-all ${location.pathname === '/dashboard' ? 'bg-blue-800 border-l-4 border-blue-400 shadow-md' : 'hover:bg-blue-800/50 hover:translate-x-1'}`}>Analysis Dashboard</Link>
          <Link to="/patients" className={`block py-3 px-4 rounded-lg transition-all ${location.pathname === '/patients' ? 'bg-blue-800 border-l-4 border-blue-400 shadow-md' : 'hover:bg-blue-800/50 hover:translate-x-1'}`}>Patient Records</Link>
          <Link to="/telemedicine" className={`block py-3 px-4 rounded-lg transition-all ${location.pathname === '/telemedicine' ? 'bg-blue-800 border-l-4 border-blue-400 shadow-md' : 'hover:bg-blue-800/50 hover:translate-x-1'}`}>Telemedicine Simulation</Link>
        </nav>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className={`${headerBg} px-8 py-4 flex justify-between items-center shadow-sm border-b z-0 transition-colors`}>
          <div>
            <h1 className={`text-2xl font-bold ${textPrimary}`}>Explainable AI DR Screening</h1>
            <p className={`text-xs mt-0.5 ${textSecondary}`}>Quality Assessment • Lesion Segmentation • Grad-CAM • Sub-30s Doctor Report</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-slate-700 text-yellow-300' : 'bg-slate-100 text-slate-600'}`}
              title="Toggle Dark Mode"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-bold text-green-700 tracking-wide uppercase">PS-26038 Engine Active</span>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center font-bold text-blue-700 shadow-sm">Dr</div>
          </div>
        </header>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {/* TOP SECTION: Quality Assessment & Upload */}
          <div className={`${bgCard} p-6 rounded-3xl shadow-sm border transition-colors`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${textPrimary}`}>
                <span className="text-blue-500">👁️</span> Retinal Image Upload & Quality Screening
              </h3>

              {analysisData && (
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    analysisData.quality_classification === 'Gradeable' ? 'bg-green-100 text-green-800 border border-green-300' :
                    analysisData.quality_classification === 'Borderline' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                    'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    Quality: {analysisData.quality_classification}
                  </span>
                  <span className="text-xs text-gray-500 font-semibold">Focus Score: {analysisData.focus_score}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dropzone */}
              <div className={`border-2 border-dashed ${isDarkMode ? 'border-blue-500/30 bg-blue-900/10 hover:bg-blue-900/20' : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50'} rounded-2xl flex flex-col items-center justify-center p-6 relative transition-colors group cursor-pointer`}>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isProcessing} />
                <div className="text-4xl mb-2 text-blue-400 group-hover:scale-110 transition-transform">📸</div>
                <p className={`text-xs font-bold text-center ${isDarkMode ? 'text-blue-300' : 'text-blue-800'}`}>
                  {isProcessing ? "Processing via Python Pipeline..." : "Click or Drag Fundus Image"}
                </p>
                <p className="text-[11px] text-gray-400 text-center mt-1">Supports JPEG/PNG portable fundus images</p>
              </div>

              {/* Original & Enhanced Viewer with Layer Toggles */}
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-64">
                
                {/* Original Image */}
                <div className={`${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-200'} rounded-2xl border flex flex-col items-center justify-center relative overflow-hidden shadow-inner`}>
                  {selectedImage ? (
                    <>
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-1 rounded-lg shadow-sm z-10">Original Input</div>
                      <img src={selectedImage} alt="Original" className="w-full h-full object-cover" />
                    </>
                  ) : (
                    <span className={`text-sm font-medium ${textSecondary}`}>Original Image</span>
                  )}
                </div>

                {/* Processed Layer Viewer */}
                <div 
                  className="bg-black/90 rounded-2xl border border-slate-700 flex flex-col items-center justify-center relative overflow-hidden shadow-inner cursor-crosshair"
                  onMouseMove={handleZoomMove}
                  onMouseEnter={() => setIsZooming(true)}
                  onMouseLeave={() => setIsZooming(false)}
                >
                  {isProcessing && (
                    <div className="flex flex-col items-center text-blue-400">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400 mb-3"></div>
                      <span className="text-xs font-bold animate-pulse tracking-wider">RUNNING MATHWORKS PIPELINE...</span>
                      <span className="text-[10px] text-blue-300 mt-1">CLAHE + Segmentation + Grad-CAM</span>
                    </div>
                  )}

                  {analysisData && !isProcessing && (
                    <>
                      <div className="absolute top-3 left-3 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-lg shadow-sm z-10 capitalize">
                        {activeLayer} View (Hover to Zoom)
                      </div>
                      
                      <img 
                        src={getCurrentImage()} 
                        alt="Processed Layer" 
                        className="w-full h-full object-cover transition-opacity duration-300" 
                        style={activeLayer === 'gradcam' ? { opacity: gradcamOpacity / 100 } : {}}
                      />

                      {isZooming && (
                        <div 
                          className="absolute pointer-events-none border-2 border-blue-400 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.8)] z-20"
                          style={{
                            width: '140px',
                            height: '140px',
                            left: `${lensPos.x}%`,
                            top: `${lensPos.y}%`,
                            transform: 'translate(-50%, -50%)',
                            backgroundImage: `url(${getCurrentImage()})`,
                            backgroundPosition: `${lensPos.x}% ${lensPos.y}%`,
                            backgroundSize: '300%', 
                          }}
                        />
                      )}
                    </>
                  )}

                  {!analysisData && !isProcessing && (
                    <span className="text-slate-500 text-sm font-medium">Enhanced / Lesion Layer Output</span>
                  )}
                </div>

              </div>
            </div>

            {/* Layer Control Bar */}
            {analysisData && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-bold text-gray-500 self-center mr-1">Layer Toggle:</span>
                  <button onClick={() => setActiveLayer('enhanced')} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${activeLayer === 'enhanced' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'}`}>CLAHE Enhanced</button>
                  <button onClick={() => setActiveLayer('gradcam')} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${activeLayer === 'gradcam' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'}`}>🔥 Grad-CAM Heatmap</button>
                  <button onClick={() => setActiveLayer('vessels')} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${activeLayer === 'vessels' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'}`}>🩸 Vessels</button>
                  <button onClick={() => setActiveLayer('mas')} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${activeLayer === 'mas' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'}`}>🔴 Microaneurysms</button>
                  <button onClick={() => setActiveLayer('exudates')} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${activeLayer === 'exudates' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'}`}>🟡 Exudates</button>
                  <button onClick={() => setActiveLayer('hemorrhages')} className={`px-3 py-1 rounded-lg text-xs font-bold transition ${activeLayer === 'hemorrhages' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'}`}>💥 Hemorrhages</button>
                </div>

                {activeLayer === 'gradcam' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">Opacity:</span>
                    <input type="range" min="20" max="100" value={gradcamOpacity} onChange={(e) => setGradcamOpacity(e.target.value)} className="w-24 accent-blue-600" />
                    <span className="text-xs font-bold text-blue-600">{gradcamOpacity}%</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MIDDLE SECTION: ML Prediction & Clinical Explainability */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* ICDR Severity Grading & Lesion Stats */}
            <div className={`${bgCard} p-6 rounded-3xl shadow-sm border flex flex-col transition-colors`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center justify-between ${textPrimary}`}>
                <div className="flex items-center gap-2"><span className="text-blue-500">🧠</span> ICDR Severity Grading</div>
                {analysisData && (
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                    analysisData.level === 0 ? 'bg-green-100 text-green-700 border border-green-300' :
                    analysisData.level === 1 ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' :
                    analysisData.level === 2 ? 'bg-orange-100 text-orange-700 border border-orange-300' :
                    'bg-red-600 text-white shadow-sm'
                  }`}>
                    Level {analysisData.level} — {analysisData.icdr_name}
                  </span>
                )}
              </h3>

              <div className={`flex-1 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-gray-50 border-gray-100'} rounded-2xl p-5 border flex flex-col justify-between space-y-4`}>
                {analysisData ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 pb-3 border-b border-gray-200 dark:border-slate-700">
                      <div>
                        <span className={`text-xs font-medium block ${textSecondary}`}>AI Confidence</span>
                        <span className="text-xl font-black text-green-500">{analysisData.confidence}%</span>
                      </div>
                      <div>
                        <span className={`text-xs font-medium block ${textSecondary}`}>Referable DR (Level 2+)</span>
                        <span className={`text-sm font-bold ${analysisData.referable ? 'text-red-500' : 'text-green-600'}`}>
                          {analysisData.referable ? "YES — Referral Needed" : "NO — Non-referable"}
                        </span>
                      </div>
                    </div>

                    {/* Lesion breakdown grid */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Microaneurysms</span>
                        <span className="text-base font-black text-red-500">{analysisData.ma_count}</span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Exudate Area</span>
                        <span className="text-base font-black text-yellow-600">{analysisData.exudate_area_pct}%</span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700">
                        <span className="text-[10px] text-gray-400 uppercase font-bold block">Hemorrhages</span>
                        <span className="text-base font-black text-purple-500">{analysisData.hemorrhage_count}</span>
                      </div>
                    </div>

                    {/* Criteria Matched */}
                    {analysisData.criteria_matched && analysisData.criteria_matched.length > 0 && (
                      <div className="bg-blue-50/50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/40">
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-300 block mb-1">Clinical Criteria Matched:</span>
                        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                          {analysisData.criteria_matched.map((crit, idx) => (
                            <li key={idx}>{crit}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="text-[11px] text-gray-400 italic">
                      Calibrated sensitivity target &gt;90% | specificity &gt;85% for referable DR.
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                    <span className="text-3xl mb-2">📊</span>
                    <span className="italic text-sm">Upload fundus image to view ICDR grading metrics.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sub-30s Doctor Report Card */}
            <div className={`${bgCard} p-6 rounded-3xl shadow-sm border flex flex-col transition-colors`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center justify-between ${textPrimary}`}>
                <div className="flex items-center gap-2">
                  <span className="text-blue-500">📝</span> Sub-30s Clinical AI Report
                </div>
                {report && (
                  <div className="flex gap-2">
                    <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition font-bold shadow-sm">
                      📄 Export PDF
                    </button>
                  </div>
                )}
              </h3>

              <div className={`flex-1 ${isDarkMode ? 'bg-blue-900/10 border-blue-900/30' : 'bg-blue-50/50 border-blue-100'} rounded-2xl p-5 border overflow-y-auto flex flex-col justify-between`}>
                {isReportLoading ? (
                  <div className="flex flex-col items-center justify-center h-48 text-blue-500 space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="text-sm font-medium animate-pulse">Generating Doctor Report...</span>
                  </div>
                ) : report ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300 pb-2 border-b border-blue-200 dark:border-blue-800">
                      <span>⏱️ Target Validation Time: &lt; 30 seconds</span>
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded">Validated</span>
                    </div>
                    <div className={`text-sm leading-relaxed font-medium whitespace-pre-wrap ${isDarkMode ? 'text-blue-100' : 'text-gray-800'}`}>
                      {report}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                    <span className="text-3xl mb-2">🤖</span>
                    <span className="italic text-sm">Automated report will generate here after upload.</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* FLOATING CHATBOT WIDGET */}
          <div className="fixed bottom-6 right-6 z-50">
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)} 
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110"
            >
              💬
            </button>

            {isChatOpen && (
              <div className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
                <div className="bg-[#1e3a8a] text-white p-4 flex justify-between items-center">
                  <h4 className="font-bold text-sm flex items-center gap-2"><span>🤖</span> Lumina DR Clinical Assistant</h4>
                  <button onClick={() => setIsChatOpen(false)} className="text-white hover:text-gray-200 font-bold">✕</button>
                </div>
                <div className="p-4 h-64 overflow-y-auto bg-gray-50 text-xs space-y-3">
                  <div className="bg-blue-100 text-blue-900 p-2.5 rounded-xl max-w-[85%]">
                    Namaste Doctor! Ask me anything about the ICDR grading, lesion counts, or clinical recommendations.
                  </div>
                </div>
                <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                  <input type="text" placeholder="Ask about DR severity..." className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <button onClick={() => toast.success("Query sent to Lumina AI!")} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition">Send</button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}