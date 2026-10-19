import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function PatientRecords() {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchPatients = async () => {
      let remoteData = [];
      try {
        const response = await fetch("http://127.0.0.1:5000/api/patients");
        if (response.ok) {
          remoteData = await response.json();
        }
      } catch (error) {
        console.warn("Backend API offline, using cached records.");
      }

      // Merge with Public App Bookings from LocalStorage
      const localData = JSON.parse(localStorage.getItem('lumina_patients') || '[]');
      
      const defaultData = [
        { id: "PAT-8821", name: "Ramesh Sharma", age: 54, date: "2026-08-28", level: 2, status: "Referable DR", doctor: "Dr. Sharma" },
        { id: "PAT-9032", name: "Sita Devi", age: 61, date: "2026-08-29", level: 4, status: "Proliferative DR", doctor: "Dr. Verma" },
        { id: "PAT-7710", name: "Amit Patel", age: 42, date: "2026-08-27", level: 0, status: "No DR", doctor: "Dr. Sharma" }
      ];

      // Merge unique records
      const merged = [...localData, ...remoteData, ...defaultData];
      const uniquePatients = Array.from(new Map(merged.map(item => [item.id, item])).values());
      
      setPatients(uniquePatients);
      setIsLoading(false);
    };

    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    if (patients.length === 0) {
      toast.warning("No data available to export!");
      return;
    }

    const headers = ["Patient ID", "Name", "Age", "Scan Date", "Severity", "Clinical Status", "Attending Doctor"];
    const csvRows = [headers.join(",")];

    patients.forEach(p => {
      const row = [p.id, p.name, p.age, p.date, `Level ${p.level}`, p.status, p.doctor];
      csvRows.push(row.map(val => `"${val}"`).join(","));
    });

    const csvData = csvRows.join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "Lumina_Patient_Records.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success("Patient Records exported to Excel/CSV!");
  };

  const getLevelBadge = (level) => {
    const styles = {
      0: "bg-green-100 text-green-700 border-green-200",
      1: "bg-yellow-100 text-yellow-700 border-yellow-200",
      2: "bg-orange-100 text-orange-700 border-orange-200",
      3: "bg-red-100 text-red-700 border-red-200",
      4: "bg-red-600 text-white border-red-700 shadow-sm",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[level] || "bg-gray-100"}`}>
        Level {level}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex relative">
      <div className="hidden md:flex md:flex-col w-64 bg-[#1e3a8a] text-white shadow-xl z-10">
        <div className="p-6 border-b border-blue-800">
          <h2 className="text-2xl font-black tracking-wider flex items-center gap-2">
            <span className="text-blue-400">✦</span> Lumina DR
          </h2>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2 text-sm font-medium">
          <Link to="/dashboard" className={`block py-3 px-4 rounded-lg transition-all ${location.pathname === '/dashboard' ? 'bg-blue-800 border-l-4 border-blue-400 shadow-md' : 'hover:bg-blue-800/50 hover:translate-x-1'}`}>Analysis Dashboard</Link>
          <Link to="/patients" className={`block py-3 px-4 rounded-lg transition-all ${location.pathname === '/patients' ? 'bg-blue-800 border-l-4 border-blue-400 shadow-md' : 'hover:bg-blue-800/50 hover:translate-x-1'}`}>Patient Records</Link>
          <Link to="/telemedicine" className={`block py-3 px-4 rounded-lg transition-all ${location.pathname === '/telemedicine' ? 'bg-blue-800 border-l-4 border-blue-400 shadow-md' : 'hover:bg-blue-800/50 hover:translate-x-1'}`}>Telemedicine Simulation</Link>
        </nav>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white px-8 py-5 flex justify-between items-center shadow-sm border-b border-gray-100 z-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Clinical Database</h1>
            <p className="text-sm text-gray-500 mt-0.5">Real-time synced patient screenings & booking logs</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
              <input type="text" placeholder="Search patient ID or name..." className="pl-10 pr-4 py-2 w-72 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            
            <button onClick={handleExportCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
              <span>📊</span> Export Data
            </button>
            
            <div className="h-10 w-10 rounded-full bg-blue-100 border-2 border-blue-500 flex items-center justify-center font-bold text-blue-700">DR</div>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Syncing database...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Patient ID</th>
                      <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Patient Details</th>
                      <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Scan / Booking Date</th>
                      <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Severity</th>
                      <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Status</th>
                      <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase">Doctor</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {filteredPatients.map((patient, index) => (
                      <tr key={index} onClick={() => setSelectedPatient(patient)} className="border-b border-gray-100 hover:bg-blue-50/80 transition-colors cursor-pointer group">
                        <td className="py-4 px-6 font-semibold text-blue-900">{patient.id}</td>
                        <td className="py-4 px-6">
                          <p className="font-bold text-gray-900 group-hover:text-blue-700">{patient.name}</p>
                          <p className="text-xs text-gray-500">{patient.phone || `${patient.age} yrs`}</p>
                        </td>
                        <td className="py-4 px-6 text-gray-600 font-medium">{patient.date}</td>
                        <td className="py-4 px-6">{getLevelBadge(patient.level)}</td>
                        <td className="py-4 px-6 font-medium text-gray-800">{patient.status}</td>
                        <td className="py-4 px-6 text-gray-500">{patient.doctor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-[#1e3a8a] text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">👤 {selectedPatient.name}</h3>
                <p className="text-blue-200 text-xs mt-1">ID: {selectedPatient.id}</p>
              </div>
              <button onClick={() => setSelectedPatient(null)} className="h-8 w-8 bg-blue-800 rounded-full font-bold">✕</button>
            </div>
            <div className="p-6 space-y-3 bg-gray-50">
              <div className="bg-white p-4 rounded-xl border space-y-2 text-sm">
                <p><strong>Severity Level:</strong> Level {selectedPatient.level}</p>
                <p><strong>Status:</strong> {selectedPatient.status}</p>
                <p><strong>Date:</strong> {selectedPatient.date}</p>
                <p><strong>Doctor Assigned:</strong> {selectedPatient.doctor}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}