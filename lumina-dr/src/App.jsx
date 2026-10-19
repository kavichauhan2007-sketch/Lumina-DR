import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/login';
import Dashboard from './pages/Dashboard';
import PatientRecords from './pages/PatientRecords';
import Telemedicine from './pages/Telemedicine';
import PatientHome from './pages/PatientHome'; 
import About from './pages/About';

export default function App() {
  return (
    <BrowserRouter>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<PatientRecords />} />
        <Route path="/telemedicine" element={<Telemedicine />} />
        <Route path="/patient-home" element={<PatientHome />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}