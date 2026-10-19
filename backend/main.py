"""
main.py  —  Lumina DR FastAPI Backend
MathWorks PS-26038: Explainable AI for Diabetic Retinopathy Screening in Rural India

Endpoints:
  POST /api/process-analysis        — Full DR analysis pipeline (quality + segmentation + grading)
  GET  /api/patients                — Patient records
  GET  /api/network-stats           — Live network bandwidth/latency data
  POST /api/simulink-simulation     — District-level telemedicine simulation
  GET  /                            — Health check
"""

import numpy as np
from datetime import datetime, timedelta, timezone
from typing import Annotated

import cv2
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from quality_enhancement   import run_quality_pipeline
from structure_segmentation import run_segmentation_pipeline
from dr_grader              import grade_dr_severity, build_full_analysis_report
from simulink_engine        import run_telemedicine_simulation

app = FastAPI(
    title       = "Lumina DR — MathWorks PS-26038",
    description = "Explainable AI for Diabetic Retinopathy Screening in Rural India",
    version     = "2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins     = ["*"],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# 0. IMAGE VALIDATION HELPER (STRICT MODE)
# ─────────────────────────────────────────────────────────────────────────────

def validate_fundus_image(img_bgr: np.ndarray) -> bool:
    """
    Strict Check: Converts to Grayscale.
    Verifies that the 4 corners are pitch black (mask) AND the center is bright (retina).
    """
    # 1. Convert to grayscale for accurate brightness calculation
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    
    margin = int(min(h, w) * 0.05) 
    if margin == 0:
        return False
        
    # 2. Extract 4 corners
    tl = gray[0:margin, 0:margin]
    tr = gray[0:margin, w-margin:w]
    bl = gray[h-margin:h, 0:margin]
    br = gray[h-margin:h, w-margin:w]
    
    # 3. Extract the center region
    cy, cx = h // 2, w // 2
    center = gray[cy-margin : cy+margin, cx-margin : cx+margin]
    
    corner_mean = float(np.mean([tl, tr, bl, br]))
    center_mean = float(np.mean(center))
    
    # RULE: Corners must be very dark (< 30) AND Center must be bright (> 50)
    if corner_mean > 30.0:
        return False  # Corners are too bright (like a normal car photo)
        
    if center_mean < 50.0:
        return False  # Center is too dark (not a valid retina scan)
        
    return True


# ─────────────────────────────────────────────────────────────────────────────
# 1. FULL DR ANALYSIS PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/process-analysis")
async def process_full_analysis(
    fundus_image: Annotated[UploadFile, File(...)]
):
    """
    Complete DR screening pipeline:
      1. Image validation (Reject cars/random images)
      2. Image quality assessment + adaptive CLAHE enhancement
      3. Retinal structure & lesion segmentation (MA, exudates, hemorrhages, NV)
      4. Grad-CAM explainability overlay
      5. ICDR 0-4 DR severity grading with confidence
      6. Clinical action recommendation
    """
    # Read and decode image
    contents = await fundus_image.read()
    nparr    = np.frombuffer(contents, np.uint8)
    img_bgr  = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        return {"success": False, "error": "Failed to decode image. Ensure it is a valid JPEG/PNG."}

    # NEW: Validate if the image is actually a retinal scan before processing
    if not validate_fundus_image(img_bgr):
        return {
            "success": False, 
            "error": "Image validation failed. Please upload a valid retinal fundus scan, not a general photograph."
        }

    # Stage 1: Quality Assessment & Enhancement
    quality_result = run_quality_pipeline(img_bgr)
    enhanced_bgr   = quality_result["enhanced_bgr"]

    # Stage 2: Retinal Segmentation on enhanced image
    seg_result = run_segmentation_pipeline(enhanced_bgr)
    # Remove non-JSON-serializable field
    seg_result.pop("_result_obj", None)

    # Stage 3: DR Grading
    grade_result = grade_dr_severity(seg_result)

    # Stage 4: Build unified report
    report = build_full_analysis_report(quality_result, seg_result, grade_result)
    report["success"] = True

    return report


# ─────────────────────────────────────────────────────────────────────────────
# 2. LEGACY CLAHE ENDPOINT (backward compatibility)
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/process-clahe")
async def process_clahe_legacy(
    fundus_image: Annotated[UploadFile, File(...)]
):
    """Legacy CLAHE endpoint — proxies to full analysis pipeline."""
    contents = await fundus_image.read()
    nparr    = np.frombuffer(contents, np.uint8)
    img_bgr  = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img_bgr is None:
        return {"success": False, "error": "Invalid image"}
        
    # NEW: Add validation here too
    if not validate_fundus_image(img_bgr):
        return {"success": False, "error": "Please upload a valid retinal fundus scan."}

    quality_result = run_quality_pipeline(img_bgr)
    enhanced_bgr   = quality_result["enhanced_bgr"]
    seg_result     = run_segmentation_pipeline(enhanced_bgr)
    seg_result.pop("_result_obj", None)
    grade_result   = grade_dr_severity(seg_result)

    return {
        "success":      True,
        "level":        grade_result["level"],
        "lesions":      seg_result["lesion_summary"],
        "confidence":   grade_result["confidence"],
        "heatmapImage": seg_result["gradcam_b64"],
        # Extra fields
        "icdr_name":    grade_result["icdr_name"],
        "action":       grade_result["action"],
        "referable":    grade_result["referable"],
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3. PATIENT RECORDS
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/patients")
async def get_patients():
    return [
        {
            "id":     "PT-8021",
            "name":   "Ramesh Sharma",
            "age":    54,
            "date":   "2026-08-28",
            "level":  4,
            "status": "Proliferative DR",
            "doctor": "Dr. S. K. Mathur",
            "lesions": "Neovascularization at disc, vitreous hemorrhages",
            "referable": True,
        },
        {
            "id":     "PT-8022",
            "name":   "Sunita Verma",
            "age":    61,
            "date":   "2026-08-28",
            "level":  0,
            "status": "No DR",
            "doctor": "Dr. S. K. Mathur",
            "lesions": "No significant lesions detected",
            "referable": False,
        },
        {
            "id":     "PT-8023",
            "name":   "Karan Patel",
            "age":    45,
            "date":   "2026-08-27",
            "level":  2,
            "status": "Moderate NPDR",
            "doctor": "Dr. A. Gupta",
            "lesions": "12 microaneurysms, exudates 1.2% area",
            "referable": True,
        },
        {
            "id":     "PT-8024",
            "name":   "Anita Desai",
            "age":    59,
            "date":   "2026-08-27",
            "level":  3,
            "status": "Severe NPDR",
            "doctor": "Dr. A. Gupta",
            "lesions": "18 hemorrhages (dot-blot), venous beading, exudates 4.1%",
            "referable": True,
        },
        {
            "id":     "PT-8025",
            "name":   "Vikram Singh",
            "age":    67,
            "date":   "2026-08-26",
            "level":  1,
            "status": "Mild NPDR",
            "doctor": "Dr. S. K. Mathur",
            "lesions": "3 microaneurysms only",
            "referable": False,
        },
        {
            "id":     "PT-8026",
            "name":   "Priya Nair",
            "age":    48,
            "date":   "2026-08-26",
            "level":  2,
            "status": "Moderate NPDR",
            "doctor": "Dr. R. Mehta",
            "lesions": "8 microaneurysms, 2 hemorrhages (dot-blot)",
            "referable": True,
        },
        {
            "id":     "PT-8027",
            "name":   "Gopal Das",
            "age":    71,
            "date":   "2026-08-25",
            "level":  4,
            "status": "Proliferative DR",
            "doctor": "Dr. R. Mehta",
            "lesions": "Neovascularization, pre-retinal hemorrhage, cotton-wool spots",
            "referable": True,
        },
    ]


# ─────────────────────────────────────────────────────────────────────────────
# 4. LIVE NETWORK STATS
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/api/network-stats")
async def get_network_stats():
    """Return last 30 minutes of bandwidth/latency stats (5-minute intervals)."""
    import random
    now  = datetime.now(timezone.utc)
    data = []
    for i in range(6, -1, -1):
        t = (now - timedelta(minutes=i * 5)).strftime("%H:%M")
        data.append({
            "time":      t,
            "bandwidth": round(random.uniform(1.0, 18.5), 2),
            "latency":   round(random.uniform(40, 180), 0),
        })
    return data


# ─────────────────────────────────────────────────────────────────────────────
# 5. SIMULINK DISTRICT SIMULATION
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/api/simulink-simulation")
async def run_simulation(
    population:          int   = Form(100000),
    num_phcs:            int   = Form(5),
    network_type:        str   = Form("3G"),
    processing_mode:     str   = Form("hybrid"),
    doctors_available:   int   = Form(2),
    daily_camera_hours:  float = Form(6.0),
    doctor_review_sec:   float = Form(30.0),
):
    """
    Run the district-level Simulink-equivalent telemedicine pipeline simulation.
    Accepts form parameters for slider-driven UI interaction.
    """
    result = run_telemedicine_simulation(
        population          = population,
        num_phcs            = num_phcs,
        network_type        = network_type,
        processing_mode     = processing_mode,
        doctors_available   = doctors_available,
        daily_camera_hours  = daily_camera_hours,
        doctor_review_sec   = doctor_review_sec,
    )
    result["success"] = True
    return result


# ─────────────────────────────────────────────────────────────────────────────
# 6. HEALTH CHECK
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
async def health_check():
    return {
        "status":  "operational",
        "message": "Lumina DR Backend — MathWorks PS-26038 — All systems nominal.",
        "version": "2.0.0",
    }  