# Lumina-DR: Explainable AI for Diabetic Retinopathy Screening in Rural India

<div align="center">

[![MathWorks PS-26038](https://img.shields.io/badge/MathWorks-Problem%20Statement%20PS--26038-red?style=for-the-badge&logo=mathworks)](https://www.mathworks.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![OpenCV](https://img.shields.io/badge/Vision-OpenCV%20%2B%20NumPy-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white)](https://opencv.org/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**An end-to-end, explainable clinical triage and district-scale telemedicine simulation platform engineered for high-accuracy Diabetic Retinopathy (DR) screening in resource-constrained rural healthcare settings.**

[Key Features](#-key-features) • [System Architecture](#-system-architecture) • [Clinical Pipeline](#-clinical-pipeline) • [Telemedicine Simulation](#-telemedicine-simulation-engine) • [Quickstart Guide](#-quickstart-guide) • [API Documentation](#-api-endpoints)

</div>

---

## 📌 Executive Summary & Context

Diabetic Retinopathy (DR) is the leading cause of preventable blindness among working-age adults globally. In India alone, over **77 million people** live with diabetes, with more than 65% residing in rural or semi-urban regions where ophthalmologist density drops to **less than 1 specialist per 100,000 citizens**.

Primary Health Centres (PHCs) face three critical bottlenecks:
1. **Low-Cost Camera Artifacts & Ungradeable Scans:** Poor focus, non-uniform illumination, and cataract artifacts lead to false negatives or missed diagnoses.
2. **Bandwidth & Connectivity Constraints:** Intermittent 2G/3G or high-latency satellite uplinks stall cloud-based heavy neural network inferences.
3. **Black-Box AI Trust Deficit:** Medical staff require localized, explainable visual evidence (lesion maps, Grad-CAM overlays) and clear referral urgency guidelines.

**Lumina-DR** solves these challenges by combining:
- **Real-time Quality Assessment & Adaptive CLAHE Enhancement** for sub-optimal fundus images.
- **Multi-task Retinal Structure & Pathological Lesion Segmentation** (Optic Disc, Fovea, Vessels, Microaneurysms, Exudates, Hemorrhages, Neovascularization).
- **International Clinical Diabetic Retinopathy (ICDR 0–4) Severity Grading** with automated referral triage.
- **District-Level Simulink-Equivalent Telemedicine Simulation** modeling edge vs. cloud latency, bandwidth profiles, and queue dynamics for 100,000+ patient populations.
- **Multimodal AI Patient & Physician Handover Reports** with one-click clinical PDF generation.

---

## 🚀 Key Features

- 🔬 **Adaptive Image Quality Engine (QA):** Evaluates Laplacian focus sharpness, illumination variance, and field-of-view (FOV) integrity with instant recapture prompts.
- 👁️ **Anatomical Structure Localization:** Auto-detects Optic Disc (OD) centers using circular Hough transforms and localizes the Macula/Fovea centralis.
- 🩸 **Lesion-Specific Detection:**
  - **Microaneurysms (MAs):** Morphological sub-pixel top-hat filters and blob radius analysis.
  - **Hard Exudates:** High-luminance multi-channel thresholding for lipid leakage.
  - **Hemorrhages:** Dark-region morphology distinguishing dot-blot and flame hemorrhages.
  - **Neovascularization:** Abnormal vessel tortuosity and vessel density analysis near the disc.
- 🎯 **Grad-CAM Explainability Heatmaps:** Visual attention heatmaps superimposed onto the fundus scan highlight exact regions influencing severity classification.
- 📊 **ICDR 0–4 Severity Grading:** Fully compliant with International Clinical Diabetic Retinopathy guidelines (No DR, Mild, Moderate, Severe, Proliferative DR).
- 🌐 **Telemedicine Simulink Engine:** Interactive simulation dashboard modeling district PHC queues, network types (2G, 3G, 4G, Satellite), edge-vs-cloud triage, and annual population coverage.
- 📄 **Automated Clinical Reporting:** Instant PDF reports with patient telemetry, lesion counts, referral urgency, and plain-language summaries.

---

## 🏗️ System Architecture

```
                                    ┌────────────────────────────────────────────────────────┐
                                    │               Rural PHC / Fundus Camera                │
                                    └───────────────────────────┬────────────────────────────┘
                                                                │ Image Capture
                                                                ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                LUMINA-DR PIPELINE ENGINE                                                  │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                                           │
│  [ Stage 1: Quality Check ]  ──►  [ Stage 2: Retinal Segmentation ]  ──►  [ Stage 3: ICDR Grading ]  ──►  [ Stage 4: AI ]  │
│  • Laplacian Focus Score          • Optic Disc & Fovea Localization        • Rule-calibrated ICDR 0-4     • Grad-CAM Maps │
│  • Illumination Histogram         • Frangi Vessel Extraction               • Lesion Density Weighting     • Clinical PDF  │
│  • Adaptive CLAHE (L*a*b*)        • MA, Exudate, Hemorrhage Detection      • Referable Triage (≥ Level 2) • Doctor Notes  │
│                                                                                                                           │
└─────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────────────┘
                                              │ REST API / WebSocket
                                              ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                           INTERACTIVE DASHBOARD & SIMULINK SUITE                                          │
├───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│  • Real-time Retinal Diagnostic Viewer                                   • District Telemedicine Simulation Studio        │
│  • Patient Records & Longitudinal Tracking                              • Bandwidth & Edge/Cloud Tradeoff Analytics       │
└───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔬 Clinical Diagnostic Pipeline

### 1. Quality Assessment & Adaptive CLAHE
Fundus images captured by non-mydriatic portable cameras often suffer from inadequate illumination and motion blur:
- **Focus Metric:** Computes Laplacian variance $\sigma^2 = \text{Var}(\nabla^2 I)$. Scans with $\sigma^2 < 40$ are flagged for recapture.
- **Adaptive CLAHE:** Converts image to CIE $L^*a^*b^*$ color space, applies Contrast-Limited Adaptive Histogram Equalization on the luminance ($L^*$) and green channels, and performs bilateral filtering to suppress sensor noise while preserving lesion edges.

### 2. Anatomical & Lesion Segmentation
- **Optic Disc (OD):** Identified using high-intensity red/green channel clustering and Hough Circle Transform.
- **Vessel Network:** Extracted via morphologic morphological top-hat operations and matched thresholding.
- **Pathology Mapping:**
  - *Mild NPDR (Level 1):* Detection of isolated microaneurysms ($1 \le \text{count} \le 5$).
  - *Moderate NPDR (Level 2):* Extensive microaneurysms, early hard exudates ($>0.5\%$ area), or dot-blot hemorrhages.
  - *Severe NPDR (Level 3):* Severe hemorrhages ($\ge 10$ lesions), venous beading proxies, or IRMA indicators.
  - *Proliferative DR (Level 4):* Neovascularization (NV) detection at or away from the disc with high vascular complexity.

### 3. ICDR Severity Grading Scale

| Grade | Clinical Category | Key Diagnostic Findings | Urgency & Action |
|:---:|:---|:---|:---|
| **0** | **No DR** | No apparent lesions or vascular abnormalities | Routine 12-month annual re-screening |
| **1** | **Mild NPDR** | Microaneurysms only ($1 - 5$ lesions) | 6 to 9-month follow-up at PHC |
| **2** | **Moderate NPDR** | Microaneurysms, hard exudates, moderate hemorrhages | Refer to District Eye Hospital (within 4 weeks) |
| **3** | **Severe NPDR** | $\ge 20$ intraretinal hemorrhages, venous beading, IRMA | Urgent Specialist Referral (within 2 weeks) |
| **4** | **Proliferative DR** | Neovascularization, vitreous/pre-retinal hemorrhage | Immediate Referral for Panretinal Photocoagulation (PRP) |

---

## 📡 Telemedicine Simulation Engine

The built-in simulation engine (replicated in both Python and MATLAB/Simulink) simulates district-scale telemedicine triage:

### Network Profiles Modeled

| Network Tier | Bandwidth | Round-Trip Latency | Packet Loss Rate | Reliability |
|:---|:---:|:---:|:---:|:---:|
| **2G (EDGE)** | 0.2 Mbps | 500 ms | 8.0% | 80% |
| **3G (HSPA+)** | 2.0 Mbps | 150 ms | 3.0% | 90% |
| **4G (LTE)** | 20.0 Mbps | 40 ms | 0.5% | 97% |
| **Satellite (VSAT)** | 5.0 Mbps | 620 ms | 2.0% | 92% |

### Processing Architectures
- **Edge-Only:** Local inference on low-power PHC devices. Zero transmission latency, but limited to lightweight heuristic segmentation.
- **Cloud-Only:** Full remote inference. High upload latency on 2G/3G links creates queue bottlenecks.
- **Hybrid (Recommended):** Real-time image validation and quality triage at the Edge; Gradeable images with suspected referable DR (Level $\ge 2$) compressed and queued for cloud specialist review.

---

## 📂 Project Repository Structure

```
Lumina-DR/
├── backend/                              # Python FastAPI Backend
│   ├── main.py                           # Application entrypoint & REST API endpoints
│   ├── quality_enhancement.py            # Laplacian focus, illumination & CLAHE pipeline
│   ├── structure_segmentation.py         # Retinal structures, lesions & Grad-CAM overlays
│   ├── dr_grader.py                      # ICDR 0-4 rule-based grading & clinical reports
│   ├── simulink_engine.py                # District-level telemedicine simulation engine
│   └── requirements.txt                  # Python dependencies
│
├── lumina-dr/                            # React 19 + Vite Frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx             # AI Analysis viewer, Grad-CAM overlays & upload
│   │   │   ├── Telemedicine.jsx          # Simulink parameter tuning & district simulations
│   │   │   ├── PatientHome.jsx           # Patient portal & screening history
│   │   │   ├── PatientRecords.jsx        # Clinical patient registry & longitudinal stats
│   │   │   └── Login.jsx                 # Role-based login (Clinician, Health Worker, Patient)
│   │   ├── utils/
│   │   │   └── geminiReport.js           # Multimodal summary & LLM explanation integration
│   │   ├── App.jsx                       # Navigation & route management
│   │   ├── index.css                     # Tailwind CSS design system tokens
│   │   └── main.jsx                      # React application mount
│   ├── public/                           # Static icons & vectors
│   ├── package.json                      # Node.js dependencies
│   ├── vite.config.js                    # Vite configuration
│   └── .env.example                      # Example environment variables
│
├── matlab/                               # MathWorks Algorithm & Simulink Model Scripts
│   ├── dr_screening_pipeline.m           # Standalone MATLAB screening & image processing pipeline
│   └── telemedicine_simulink_model.m     # District telemedicine workflow & queue simulation
│
├── .gitignore                            # Version control exclusion rules
└── README.md                             # Comprehensive project documentation
```

---

## ⚡ Quickstart Guide

### Prerequisites
- **Python**: 3.10, 3.11, or 3.14 (Virtual Environment recommended)
- **Node.js**: v18+ or v20+ with npm
- **Web Browser**: Chrome, Edge, Firefox, or Safari

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows:
.\.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

# Install required dependencies
pip install -r requirements.txt

# Start the FastAPI Uvicorn server
uvicorn main:app --host 127.0.0.1 --port 5000 --reload
```

Backend will be live at:
- **API Base:** `http://127.0.0.1:5000`
- **Interactive Swagger Docs:** `http://127.0.0.1:5000/docs`

---

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to the frontend directory
cd lumina-dr

# Install npm dependencies
npm install

# (Optional) Setup environment variables
cp .env.example .env

# Launch the development server
npm run dev
```

Frontend will be accessible at:
- **Web Application:** `http://localhost:5173`

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Request Payload | Response |
|:---:|:---|:---|:---|:---|
| `GET` | `/` | System Health Check | None | `{"status": "operational"}` |
| `POST` | `/api/process-analysis` | Full DR Analysis Pipeline | `fundus_image` (Multipart Form) | Complete ICDR report, lesions, quality metrics & Grad-CAM base64 |
| `POST` | `/api/process-clahe` | Legacy CLAHE & Enhancement Proxy | `fundus_image` (Multipart Form) | Enhanced image & severity level |
| `GET` | `/api/patients` | Mock Rural Patient Registry | None | Array of patient records with DR levels |
| `GET` | `/api/network-stats` | 30-min live bandwidth/latency telemetry | None | Time-series bandwidth and latency data |
| `POST` | `/api/simulink-simulation` | District-scale Telemedicine Simulation | Form: `population`, `num_phcs`, `network_type`, `processing_mode`, `doctors_available` | Telemedicine metrics, bottleneck analysis, annual coverage projection |

---

## 📊 MATLAB & Simulink Scripts

For MathWorks-compatible environments, the `matlab/` folder contains native scripts:

```matlab
% In MATLAB terminal:
cd matlab/

% 1. Run the DR screening pipeline on a sample or synthetic fundus image:
results = dr_screening_pipeline();

% 2. Run district-level telemedicine queue simulation:
sim_results = telemedicine_simulink_model('population', 120000, 'network', '3G', 'processing_mode', 'hybrid');
```

---

## 🤝 Contributing

Contributions, feedback, and issues are welcomed!
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/clinical-enhancement`)
3. Commit your Changes (`git commit -m 'Add adaptive vessel filter'`)
4. Push to the Branch (`git push origin feature/clinical-enhancement`)
5. Open a Pull Request

---

## 📜 License & Acknowledgements

- **License:** MIT License. Free for academic, clinical, and open-source research use.
- **Challenge:** Developed for **MathWorks Problem Statement PS-26038: Explainable AI for Diabetic Retinopathy Screening in Rural India**.
- **Special Thanks:** Dedicated to healthcare workers, frontline ASHA workers, and rural medical officers across India fighting preventable blindness.
