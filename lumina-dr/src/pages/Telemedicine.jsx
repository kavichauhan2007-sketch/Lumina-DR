import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { toast } from 'react-toastify';

export default function Telemedicine() {
  const location = useLocation();

  // Telemedicine Simulink Simulator state
  const [population, setPopulation] = useState(100000);
  const [numPhcs, setNumPhcs] = useState(5);
  const [networkType, setNetworkType] = useState("3G");
  const [processingMode, setProcessingMode] = useState("hybrid");
  const [doctorsAvailable, setDoctorsAvailable] = useState(2);
  const [dailyCameraHours, setDailyCameraHours] = useState(6);
  const [doctorReviewSec, setDoctorReviewSec] = useState(30);

  const [simResults, setSimResults] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Video call mock state
  const [isCallActive, setIsCallActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const runSimulation = async () => {
    setIsSimulating(true);
    const formData = new FormData();
    formData.append("population", population);
    formData.append("num_phcs", numPhcs);
    formData.append("network_type", networkType);
    formData.append("processing_mode", processingMode);
    formData.append("doctors_available", doctorsAvailable);
    formData.append("daily_camera_hours", dailyCameraHours);
    formData.append("doctor_review_sec", doctorReviewSec);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/simulink-simulation", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSimResults(data);
      } else {
        // Fallback local calculations if backend fails
        computeLocalSimulation();
      }
    } catch (error) {
      computeLocalSimulation();
    } finally {
      setIsSimulating(false);
    }
  };

  const computeLocalSimulation = () => {
    const cameraPerPhcDay = (dailyCameraHours * 3600) / 120;
    const totalCameraDay = cameraPerPhcDay * numPhcs;
    const doctorCapDay = ((8 * 0.6 * 3600) / doctorReviewSec) * doctorsAvailable;
    const effectiveDaily = Math.min(totalCameraDay, doctorCapDay);
    const annualScreened = effectiveDaily * 300;
    const annualCoverage = Math.min(100, (annualScreened / (population * 0.6)) * 100);

    const netBw = networkType === "2G" ? 0.2 : networkType === "3G" ? 2.0 : networkType === "4G" ? 20.0 : 5.0;
    const netLat = networkType === "2G" ? 500 : networkType === "3G" ? 150 : networkType === "4G" ? 40 : 620;
    const transSec = (0.8 * 8) / netBw + netLat / 1000;
    const procSec = processingMode === "edge" ? 8.0 : 2.0;
    const totalCycle = 120 + transSec + procSec + doctorReviewSec;

    const timeSeries = [];
    for (let i = 1; i <= 30; i++) {
      timeSeries.push({
        day: i,
        patients: Math.round(effectiveDaily * (0.9 + Math.random() * 0.2)),
        queue: Math.max(0, Math.round(totalCameraDay - doctorCapDay)),
      });
    }

    setSimResults({
      population,
      num_phcs: numPhcs,
      network_type: networkType,
      processing_mode: processingMode,
      doctors_available: doctorsAvailable,
      daily_camera_hours: dailyCameraHours,
      transmission_time_sec: Math.round(transSec * 10) / 10,
      processing_time_sec: procSec,
      doctor_review_time_sec: doctorReviewSec,
      total_cycle_time_sec: Math.round(totalCycle * 10) / 10,
      images_per_phc_per_day: Math.round(cameraPerPhcDay),
      total_images_per_day: Math.round(totalCameraDay),
      total_images_per_year: Math.round(annualScreened),
      doctor_capacity_per_day: Math.round(doctorCapDay),
      effective_throughput_pct: Math.round((effectiveDaily / (totalCameraDay || 1)) * 100),
      annual_coverage_pct: Math.round(annualCoverage * 10) / 10,
      bottleneck: transSec > procSec && transSec > doctorReviewSec ? "Image Transmission" : doctorReviewSec > procSec ? "Doctor Review" : "AI Processing",
      bottleneck_detail: transSec > procSec ? `Network bandwidth (${networkType}) limiting upload` : "Doctor review capacity bottleneck",
      optimization_suggestions: [
        "Deploy edge processing to eliminate network upload latency",
        "Increase doctors or use sub-30s AI pre-triage to expand capacity",
        "Upgrade PHC connectivity to 4G LTE or Satellite"
      ],
      time_series: timeSeries,
      live_bandwidth: [
        { time: "09:00", bandwidth: netBw, latency: netLat },
        { time: "09:05", bandwidth: netBw * 0.9, latency: netLat * 1.1 },
        { time: "09:10", bandwidth: netBw * 1.1, latency: netLat * 0.95 },
        { time: "09:15", bandwidth: netBw * 0.95, latency: netLat * 1.05 },
        { time: "09:20", bandwidth: netBw * 1.05, latency: netLat * 0.98 },
      ]
    });
  };

  useEffect(() => {
    runSimulation();
  }, [population, numPhcs, networkType, processingMode, doctorsAvailable, dailyCameraHours, doctorReviewSec]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
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
          <Link to="/about" className={`block py-3 px-4 rounded-lg transition-all ${location.pathname === '/about' ? 'bg-blue-800 border-l-4 border-blue-400 shadow-md' : 'hover:bg-blue-800/50 hover:translate-x-1'}`}>About Project</Link>
        </nav>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white px-8 py-4 shadow-sm border-b border-gray-100 flex justify-between items-center z-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Simulink Telemedicine Pipeline Simulator</h1>
            <p className="text-xs text-gray-500 mt-0.5">District Screening Workflow • Bandwidth Modeling • Resource Allocation (100,000+ Patients)</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-200">
            <span className="text-xs font-bold text-blue-700">Simulink Engine Ready</span>
          </div>
        </header>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">

          {/* SIMULATOR CONTROLS CARD */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>⚙️ Simulink Model Parameters (District Level)</span>
              <button onClick={runSimulation} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition">
                {isSimulating ? "Simulating..." : "🔄 Re-run Simulation"}
              </button>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs">
              
              {/* Population */}
              <div>
                <label className="font-bold text-gray-700 flex justify-between">
                  <span>District Population</span>
                  <span className="text-blue-600 font-extrabold">{population.toLocaleString()}</span>
                </label>
                <input type="range" min="20000" max="250000" step="5000" value={population} onChange={(e) => setPopulation(Number(e.target.value))} className="w-full mt-2 accent-blue-600" />
                <span className="text-[10px] text-gray-400">At-risk (60%): {(population * 0.6).toLocaleString()}</span>
              </div>

              {/* Number of PHCs */}
              <div>
                <label className="font-bold text-gray-700 flex justify-between">
                  <span>Primary Health Centres (PHCs)</span>
                  <span className="text-blue-600 font-extrabold">{numPhcs} PHCs</span>
                </label>
                <input type="range" min="1" max="20" value={numPhcs} onChange={(e) => setNumPhcs(Number(e.target.value))} className="w-full mt-2 accent-blue-600" />
                <span className="text-[10px] text-gray-400">Cameras in district</span>
              </div>

              {/* Network Type */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">Network Connectivity</label>
                <select value={networkType} onChange={(e) => setNetworkType(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 font-bold text-gray-800">
                  <option value="2G">2G (0.2 Mbps, 500ms latency)</option>
                  <option value="3G">3G (2.0 Mbps, 150ms latency)</option>
                  <option value="4G">4G LTE (20.0 Mbps, 40ms latency)</option>
                  <option value="Satellite">Satellite (5.0 Mbps, 620ms latency)</option>
                </select>
                <span className="text-[10px] text-gray-400 mt-1 block">Models bandwidth & packet loss</span>
              </div>

              {/* Processing Mode */}
              <div>
                <label className="font-bold text-gray-700 block mb-1">AI Processing Mode</label>
                <select value={processingMode} onChange={(e) => setProcessingMode(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 font-bold text-gray-800">
                  <option value="hybrid">Hybrid (Cloud GPU + Edge Cache)</option>
                  <option value="edge">Edge Device (Jetson / RPi)</option>
                  <option value="cloud">Cloud GPU Cluster</option>
                </select>
                <span className="text-[10px] text-gray-400 mt-1 block">Inference location</span>
              </div>

              {/* Doctors Available */}
              <div>
                <label className="font-bold text-gray-700 flex justify-between">
                  <span>Available Ophthalmologists</span>
                  <span className="text-blue-600 font-extrabold">{doctorsAvailable} Doctors</span>
                </label>
                <input type="range" min="1" max="10" value={doctorsAvailable} onChange={(e) => setDoctorsAvailable(Number(e.target.value))} className="w-full mt-2 accent-blue-600" />
                <span className="text-[10px] text-gray-400">Reviewing cases</span>
              </div>

              {/* Camera Operating Hours */}
              <div>
                <label className="font-bold text-gray-700 flex justify-between">
                  <span>Daily Camera Hours / PHC</span>
                  <span className="text-blue-600 font-extrabold">{dailyCameraHours} hrs</span>
                </label>
                <input type="range" min="2" max="10" step="0.5" value={dailyCameraHours} onChange={(e) => setDailyCameraHours(Number(e.target.value))} className="w-full mt-2 accent-blue-600" />
                <span className="text-[10px] text-gray-400">Screening window</span>
              </div>

              {/* Doctor Review Time */}
              <div>
                <label className="font-bold text-gray-700 flex justify-between">
                  <span>Doctor Review Time / Case</span>
                  <span className="text-blue-600 font-extrabold">{doctorReviewSec} sec</span>
                </label>
                <input type="range" min="10" max="120" step="5" value={doctorReviewSec} onChange={(e) => setDoctorReviewSec(Number(e.target.value))} className="w-full mt-2 accent-blue-600" />
                <span className="text-[10px] text-gray-400">Target: &lt;30s human-in-loop</span>
              </div>

            </div>
          </div>

          {/* SIMULATION RESULTS KPI CARDS */}
          {simResults && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase block">Annual Patients Screened</span>
                <span className="text-2xl font-black text-blue-900">{simResults.total_images_per_year.toLocaleString()}</span>
                <div className="mt-2 text-xs font-bold text-green-600">
                  {simResults.annual_coverage_pct}% Population Covered
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase block">Daily District Capacity</span>
                <span className="text-2xl font-black text-blue-900">{simResults.total_images_per_day} cases/day</span>
                <div className="mt-2 text-xs font-bold text-blue-600">
                  {simResults.images_per_phc_per_day} cases / PHC / day
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase block">Per-Case Cycle Time</span>
                <span className="text-2xl font-black text-purple-700">{simResults.total_cycle_time_sec}s</span>
                <div className="mt-2 text-xs text-gray-500">
                  Upload: {simResults.transmission_time_sec}s | AI: {simResults.processing_time_sec}s
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-xs font-bold text-gray-400 uppercase block">Pipeline Bottleneck</span>
                <span className="text-lg font-black text-red-600">{simResults.bottleneck}</span>
                <div className="mt-2 text-[11px] text-gray-500 truncate">
                  {simResults.bottleneck_detail}
                </div>
              </div>

            </div>
          )}

          {/* SIMULINK CHARTS SECTION */}
          {simResults && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* 30-day Throughput Chart */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 uppercase mb-4">
                  30-Day Simulated District Throughput (Patients/Day)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={simResults.time_series}>
                      <defs>
                        <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="day" stroke="#64748b" tick={{fontSize: 11}} label={{ value: 'Day of Month', position: 'insideBottom', offset: -5 }} />
                      <YAxis stroke="#64748b" tick={{fontSize: 11}} />
                      <Tooltip />
                      <Area type="monotone" dataKey="patients" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorPatients)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bandwidth & Latency Chart */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                <h3 className="text-sm font-bold text-gray-800 uppercase mb-4">
                  Live Rural Telemedicine Bandwidth ({networkType})
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={simResults.live_bandwidth}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" stroke="#64748b" tick={{fontSize: 11}} />
                      <YAxis stroke="#64748b" tick={{fontSize: 11}} />
                      <Tooltip />
                      <Line type="monotone" dataKey="bandwidth" stroke="#16a34a" strokeWidth={3} name="Bandwidth (Mbps)" />
                      <Line type="monotone" dataKey="latency" stroke="#dc2626" strokeWidth={2} name="Latency (ms)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

          {/* BOTTLENECK OPTIMIZATION SUGGESTIONS */}
          {simResults && simResults.optimization_suggestions && (
            <div className="bg-blue-50/70 p-6 rounded-3xl border border-blue-200">
              <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wider mb-2">
                💡 MathWorks Simulink Resource Allocation Recommendations
              </h4>
              <ul className="text-xs text-blue-800 space-y-1.5 list-disc list-inside">
                {simResults.optimization_suggestions.map((sug, idx) => (
                  <li key={idx} className="font-semibold">{sug}</li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}