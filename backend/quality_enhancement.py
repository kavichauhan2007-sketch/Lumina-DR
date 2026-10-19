"""
quality_enhancement.py
-----------------------
MathWorks PS-26038: Lumina DR - Image Quality Assessment & Adaptive Enhancement Engine

Implements:
1. Focus / Sharpness Assessment (Laplacian Variance)
2. Illumination Assessment (Mean + Variance histogram)
3. Field of View (FOV) Assessment (Dark-corner ratio)
4. Adaptive CLAHE Enhancement (L-channel + Green-channel)
5. Bilateral denoising for borderline images
6. Gradeable / Borderline / Ungradeable classification with recapture guidance
"""

import cv2
import numpy as np
import base64


# ─────────────────────────────────────────────
# QUALITY THRESHOLDS
# ─────────────────────────────────────────────
FOCUS_THRESHOLD_GOOD     = 100.0   # Laplacian variance > 100  → sharp
FOCUS_THRESHOLD_BORDER   = 40.0    # Laplacian variance 40–100 → borderline
ILLUMINATION_MEAN_LOW    = 30      # Mean pixel value below this → too dark
ILLUMINATION_MEAN_HIGH   = 220     # Mean pixel value above this → too bright
ILLUMINATION_VAR_LOW     = 200     # Very low variance → washed out / flat image
FOV_DARK_RATIO_MAX       = 0.35    # More than 35 % dark pixels → poor FOV


# ─────────────────────────────────────────────
# 1. FOCUS SCORE  (Laplacian Variance)
# ─────────────────────────────────────────────
def compute_focus_score(gray_img: np.ndarray) -> float:
    """Return Laplacian variance as sharpness score (higher = sharper)."""
    lap = cv2.Laplacian(gray_img, cv2.CV_64F)
    return float(lap.var())


# ─────────────────────────────────────────────
# 2. ILLUMINATION SCORE
# ─────────────────────────────────────────────
def compute_illumination_metrics(gray_img: np.ndarray) -> dict:
    """Return mean and variance of pixel intensity distribution."""
    mean_val  = float(np.mean(gray_img))
    var_val   = float(np.var(gray_img))
    return {"mean": mean_val, "variance": var_val}


# ─────────────────────────────────────────────
# 3. FIELD-OF-VIEW SCORE
# ─────────────────────────────────────────────
def compute_fov_score(gray_img: np.ndarray) -> float:
    """Return ratio of very-dark pixels (< 15 intensity). High ratio = poor FOV."""
    total_pixels = gray_img.size
    dark_pixels  = np.sum(gray_img < 15)
    return float(dark_pixels / total_pixels)


# ─────────────────────────────────────────────
# 4. OVERALL QUALITY CLASSIFICATION
# ─────────────────────────────────────────────
def classify_image_quality(img_bgr: np.ndarray) -> dict:
    """
    Classify a BGR fundus image as:
        'gradeable'   - good enough for AI analysis
        'borderline'  - proceed with enhanced image
        'ungradeable' - reject and ask for recapture

    Returns dict with scores, classification, and feedback string.
    """
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

    focus_score     = compute_focus_score(gray)
    illum_metrics   = compute_illumination_metrics(gray)
    fov_dark_ratio  = compute_fov_score(gray)

    issues   = []
    feedback = []

    # --- Focus check ---
    if focus_score < FOCUS_THRESHOLD_BORDER:
        issues.append("blur")
        feedback.append("Image is blurry. Clean the camera lens and hold steady during capture.")
    elif focus_score < FOCUS_THRESHOLD_GOOD:
        issues.append("slight_blur")

    # --- Illumination check ---
    if illum_metrics["mean"] < ILLUMINATION_MEAN_LOW:
        issues.append("too_dark")
        feedback.append("Image is too dark. Increase the fundus camera illumination or dilate pupil.")
    elif illum_metrics["mean"] > ILLUMINATION_MEAN_HIGH:
        issues.append("too_bright")
        feedback.append("Image is over-exposed. Reduce light intensity and retake.")
    if illum_metrics["variance"] < ILLUMINATION_VAR_LOW:
        issues.append("low_contrast")
        feedback.append("Image has very low contrast. Ensure proper fundus camera calibration.")

    # --- FOV check ---
    if fov_dark_ratio > FOV_DARK_RATIO_MAX:
        issues.append("poor_fov")
        feedback.append("Incomplete field-of-view detected. Center the optic disc and retake the image.")

    # --- Final classification ---
    hard_issues = {"blur", "too_dark", "too_bright", "poor_fov"}
    if any(issue in hard_issues for issue in issues):
        if len([i for i in issues if i in hard_issues]) >= 2:
            classification = "ungradeable"
        else:
            classification = "borderline"
    else:
        classification = "gradeable"

    return {
        "classification": classification,
        "focus_score":    round(focus_score, 2),
        "illumination":   {
            "mean":     round(illum_metrics["mean"], 2),
            "variance": round(illum_metrics["variance"], 2),
        },
        "fov_dark_ratio": round(fov_dark_ratio, 4),
        "issues":         issues,
        "feedback":       feedback if feedback else ["Image quality is acceptable for analysis."],
    }


# ─────────────────────────────────────────────
# 5. ADAPTIVE CLAHE ENHANCEMENT
# ─────────────────────────────────────────────
def apply_adaptive_clahe(img_bgr: np.ndarray, quality_info: dict) -> np.ndarray:
    """
    Apply CLAHE enhancement tuned to quality classification:
      - gradeable  : Standard CLAHE on Green channel (clinically preferred)
      - borderline : Aggressive CLAHE + bilateral denoising
      - ungradeable: Best-effort enhancement (still returned for display)
    """
    classification = quality_info["classification"]

    if classification == "gradeable":
        # Standard: CLAHE on green channel
        green = img_bgr[:, :, 1]
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced_green = clahe.apply(green)
        # Merge back: keep B and R channels, replace G
        enhanced = img_bgr.copy()
        enhanced[:, :, 1] = enhanced_green
        return enhanced

    elif classification in ("borderline", "ungradeable"):
        # Aggressive: CLAHE on LAB L-channel + bilateral filter
        lab   = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.5, tileGridSize=(8, 8))
        l_eq  = clahe.apply(l)
        lab_eq = cv2.merge((l_eq, a, b))
        enhanced = cv2.cvtColor(lab_eq, cv2.COLOR_LAB2BGR)
        # Bilateral denoising for borderline images
        enhanced = cv2.bilateralFilter(enhanced, d=9, sigmaColor=75, sigmaSpace=75)
        return enhanced

    return img_bgr  # fallback: return original


# ─────────────────────────────────────────────
# 6. ENCODE BGR IMAGE TO BASE64 DATA-URI
# ─────────────────────────────────────────────
def encode_image_to_base64(img_bgr: np.ndarray) -> str:
    """Convert a BGR numpy image to a base64 JPEG data-URI string."""
    _, buffer = cv2.imencode('.jpg', img_bgr, [cv2.IMWRITE_JPEG_QUALITY, 92])
    b64 = base64.b64encode(buffer).decode('utf-8')
    return "data:image/jpeg;base64," + b64


# ─────────────────────────────────────────────
# 7. FULL PIPELINE (entry point)
# ─────────────────────────────────────────────
def run_quality_pipeline(img_bgr: np.ndarray) -> dict:
    """
    Full quality assessment + enhancement pipeline.

    Returns:
        quality_info          : dict from classify_image_quality()
        enhanced_image_b64    : base64 data-URI of the enhanced image
        original_image_b64    : base64 data-URI of the original image
    """
    quality_info      = classify_image_quality(img_bgr)
    enhanced_bgr      = apply_adaptive_clahe(img_bgr, quality_info)
    original_b64      = encode_image_to_base64(img_bgr)
    enhanced_b64      = encode_image_to_base64(enhanced_bgr)

    return {
        "quality":              quality_info,
        "enhanced_image_b64":   enhanced_b64,
        "original_image_b64":   original_b64,
        "enhanced_bgr":         enhanced_bgr,   # kept for downstream use (not JSON-serializable)
        "original_bgr":         img_bgr,
    }
