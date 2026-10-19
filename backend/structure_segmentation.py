"""
structure_segmentation.py
--------------------------
MathWorks PS-26038: Lumina DR - Retinal Structure & Lesion Detection Engine

Implements:
1. Optic Disc (OD) Localization  — Brightest-region + Hough Circle
2. Fovea Localization            — Darkest-region relative to OD
3. Retinal Vessel Segmentation   — Frangi-style: Green channel + top-hat filtering
4. Microaneurysm (MA) Detection  — Sub-pixel top-hat + blob analysis
5. Hard Exudate Detection        — High-luminance thresholding (white/yellow lesions)
6. Hemorrhage Detection          — Dark-region morphology (flame vs dot-blot)
7. Neovascularization Indicator  — Abnormal vessel complexity near disc
8. Grad-CAM Heatmap Overlay      — Colorized attention map from lesion density
"""

import cv2
import numpy as np
import base64
from dataclasses import dataclass, field
from typing import Optional, Tuple


# ─────────────────────────────────────────────────────────────────────────────
# DATA CONTAINERS
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class SegmentationResult:
    # Optic Disc
    od_center:   Optional[Tuple[int, int]] = None
    od_radius:   Optional[int]             = None
    # Fovea
    fovea_center: Optional[Tuple[int, int]] = None
    # Vessel mask
    vessel_mask:  Optional[np.ndarray]     = None
    vessel_density: float = 0.0            # fraction of retinal area covered by vessels
    # Lesion counts & masks
    ma_count:    int = 0
    ma_mask:     Optional[np.ndarray] = None
    exudate_area_pct: float = 0.0
    exudate_mask:     Optional[np.ndarray] = None
    hemorrhage_count:    int = 0
    hemorrhage_type:     str = "none"      # "none" | "dot-blot" | "flame" | "mixed"
    hemorrhage_mask:     Optional[np.ndarray] = None
    neovascularization:  bool = False
    nv_confidence:       float = 0.0
    # Composite
    lesion_summary: str = ""


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def _get_retinal_mask(gray: np.ndarray) -> np.ndarray:
    """Create a circular mask covering the retinal field."""
    h, w = gray.shape
    mask = np.zeros((h, w), dtype=np.uint8)
    cx, cy = w // 2, h // 2
    r = min(cx, cy) - 10
    cv2.circle(mask, (cx, cy), r, 255, -1)
    return mask


def _retinal_area(mask: np.ndarray) -> int:
    return int(np.count_nonzero(mask))


# ─────────────────────────────────────────────────────────────────────────────
# 1. OPTIC DISC LOCALIZATION
# ─────────────────────────────────────────────────────────────────────────────

def localize_optic_disc(img_bgr: np.ndarray) -> Tuple[Optional[Tuple[int,int]], Optional[int]]:
    """
    Locate the optic disc using brightest-region centroid + Hough Circle refinement.
    Returns (center_xy, radius).
    """
    green     = img_bgr[:, :, 1]
    blurred   = cv2.GaussianBlur(green, (21, 21), 0)

    # Brightest ROI
    _, max_val, _, max_loc = cv2.minMaxLoc(blurred)
    bright_thresh          = int(max_val * 0.85)
    _, bright_mask         = cv2.threshold(blurred, bright_thresh, 255, cv2.THRESH_BINARY)
    kernel                 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))
    bright_mask            = cv2.morphologyEx(bright_mask, cv2.MORPH_CLOSE, kernel)

    M = cv2.moments(bright_mask)
    if M["m00"] > 0:
        cx = int(M["m10"] / M["m00"])
        cy = int(M["m01"] / M["m00"])
    else:
        cx, cy = max_loc

    # Hough circle refinement in a local ROI
    h, w  = green.shape
    roi_r = min(h, w) // 4
    x1, y1 = max(0, cx - roi_r), max(0, cy - roi_r)
    x2, y2 = min(w, cx + roi_r), min(h, cy + roi_r)
    roi    = green[y1:y2, x1:x2]
    roi_b  = cv2.GaussianBlur(roi, (9, 9), 2)

    circles = cv2.HoughCircles(
        roi_b, cv2.HOUGH_GRADIENT,
        dp=1, minDist=roi_r,
        param1=50, param2=25,
        minRadius=roi_r // 6,
        maxRadius=roi_r // 2,
    )

    if circles is not None:
        c = circles[0, 0]
        od_center = (int(c[0]) + x1, int(c[1]) + y1)
        od_radius = int(c[2])
    else:
        # Fallback: estimate radius from bright-mask area
        area        = int(np.count_nonzero(bright_mask))
        od_radius   = max(20, int(np.sqrt(area / np.pi)))
        od_center   = (cx, cy)

    return od_center, od_radius


# ─────────────────────────────────────────────────────────────────────────────
# 2. FOVEA LOCALIZATION
# ─────────────────────────────────────────────────────────────────────────────

def localize_fovea(img_bgr: np.ndarray, od_center: Optional[Tuple[int,int]]) -> Optional[Tuple[int,int]]:
    """
    Locate fovea as the darkest region in the image, constrained to
    the temporal half (opposite the optic disc).
    """
    green    = img_bgr[:, :, 1].astype(np.float32)
    h, w     = green.shape
    blurred  = cv2.GaussianBlur(green, (31, 31), 0)

    # Restrict search to temporal half
    if od_center is not None:
        od_x = od_center[0]
        if od_x < w // 2:
            # OD on nasal left → fovea on temporal right
            search_region = blurred[:, w // 2:]
            offset_x      = w // 2
        else:
            search_region = blurred[:, :w // 2]
            offset_x      = 0
    else:
        search_region = blurred
        offset_x      = 0

    _, _, min_loc, _ = cv2.minMaxLoc(search_region)
    fovea = (min_loc[0] + offset_x, min_loc[1])
    return fovea


# ─────────────────────────────────────────────────────────────────────────────
# 3. VESSEL SEGMENTATION  (Green channel top-hat + adaptive threshold)
# ─────────────────────────────────────────────────────────────────────────────

def segment_vessels(img_bgr: np.ndarray) -> Tuple[np.ndarray, float]:
    """
    Segment retinal blood vessels using morphological top-hat transform
    on the green channel, followed by adaptive thresholding.

    Returns (vessel_mask_binary, density_fraction).
    """
    green   = img_bgr[:, :, 1]
    blur    = cv2.GaussianBlur(green, (5, 5), 0)

    # CLAHE to improve vessel contrast
    clahe   = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    eq      = clahe.apply(blur)

    # Black-hat transform reveals dark vessels on bright background
    kernel  = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    black_hat = cv2.morphologyEx(eq, cv2.MORPH_BLACKHAT, kernel)

    # Adaptive threshold
    vessel_mask = cv2.adaptiveThreshold(
        black_hat, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY,
        blockSize=11, C=-2
    )

    # Morphological cleanup
    k2 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    vessel_mask = cv2.morphologyEx(vessel_mask, cv2.MORPH_CLOSE, k2)

    retinal_mask = _get_retinal_mask(green)
    vessel_mask  = cv2.bitwise_and(vessel_mask, retinal_mask)

    retinal_area = _retinal_area(retinal_mask)
    vessel_area  = int(np.count_nonzero(vessel_mask))
    density      = vessel_area / retinal_area if retinal_area > 0 else 0.0

    return vessel_mask, density


# ─────────────────────────────────────────────────────────────────────────────
# 4. MICROANEURYSM (MA) DETECTION — sub-pixel top-hat + blob analysis
# ─────────────────────────────────────────────────────────────────────────────

def detect_microaneurysms(img_bgr: np.ndarray) -> Tuple[int, np.ndarray]:
    """
    Detect microaneurysms (tiny dark red dots 10-100 µm diameter) using
    morphological top-hat on the green channel.

    Returns (ma_count, ma_mask).
    """
    green   = img_bgr[:, :, 1]
    eq      = cv2.equalizeHist(green)

    # Small structuring element to isolate tiny dark blobs
    k_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    top_hat = cv2.morphologyEx(eq, cv2.MORPH_TOPHAT, k_small)

    # Threshold to isolate bright spots (inverted = dark blobs = MAs)
    _, thresh = cv2.threshold(top_hat, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # Find blobs
    params              = cv2.SimpleBlobDetector_Params()
    params.filterByArea = True
    params.minArea      = 4
    params.maxArea      = 200
    params.filterByCircularity = True
    params.minCircularity      = 0.5
    params.filterByConvexity   = True
    params.minConvexity        = 0.7

    # Use connected components as robust alternative
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(thresh, connectivity=8)

    ma_mask = np.zeros_like(green)
    ma_count = 0
    for i in range(1, num_labels):
        area = stats[i, cv2.CC_STAT_AREA]
        if 4 <= area <= 300:
            # Eccentricity check: small compact blobs only
            w = stats[i, cv2.CC_STAT_WIDTH]
            h = stats[i, cv2.CC_STAT_HEIGHT]
            aspect = (w / h) if h > 0 else 0
            if 0.4 < aspect < 2.5:
                ma_mask[labels == i] = 255
                ma_count += 1

    return ma_count, ma_mask


# ─────────────────────────────────────────────────────────────────────────────
# 5. HARD EXUDATE DETECTION — high-luminance white/yellow lesions
# ─────────────────────────────────────────────────────────────────────────────

def detect_exudates(img_bgr: np.ndarray, od_center=None, od_radius=None) -> Tuple[float, np.ndarray]:
    """
    Detect hard exudates (bright white/yellow deposits) using HSV + green-channel
    thresholding, excluding the optic disc region.

    Returns (area_pct, exudate_mask).
    """
    hsv  = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    v    = hsv[:, :, 2]
    s    = hsv[:, :, 1]

    # High-value, low-saturation regions = bright white deposits
    _, bright_mask = cv2.threshold(v, 180, 255, cv2.THRESH_BINARY)
    _, low_sat     = cv2.threshold(s, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    exudate_mask   = cv2.bitwise_and(bright_mask, low_sat)

    # Remove optic disc (always bright)
    if od_center and od_radius:
        cv2.circle(exudate_mask, od_center, int(od_radius * 1.2), 0, -1)

    # Morphological cleanup
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    exudate_mask = cv2.morphologyEx(exudate_mask, cv2.MORPH_OPEN, k)
    exudate_mask = cv2.morphologyEx(exudate_mask, cv2.MORPH_CLOSE, k)

    retinal_mask = _get_retinal_mask(v)
    exudate_mask = cv2.bitwise_and(exudate_mask, retinal_mask)

    retinal_area = _retinal_area(retinal_mask)
    exudate_area = int(np.count_nonzero(exudate_mask))
    area_pct     = (exudate_area / retinal_area * 100) if retinal_area > 0 else 0.0

    return round(area_pct, 3), exudate_mask


# ─────────────────────────────────────────────────────────────────────────────
# 6. HEMORRHAGE DETECTION — flame vs dot-blot morphology
# ─────────────────────────────────────────────────────────────────────────────

def detect_hemorrhages(img_bgr: np.ndarray, vessel_mask: np.ndarray) -> Tuple[int, str, np.ndarray]:
    """
    Detect hemorrhages by isolating dark red blobs larger than MAs
    but not part of normal vessel tree.

    Returns (count, type_str, hemorrhage_mask).
    """
    red   = img_bgr[:, :, 2].astype(np.int16)
    green = img_bgr[:, :, 1].astype(np.int16)

    # Dark-red regions: red channel > blue, red channel significantly higher
    red_dominance = np.clip(red - green, 0, 255).astype(np.uint8)

    _, reddish_mask = cv2.threshold(red_dominance, 20, 255, cv2.THRESH_BINARY)

    # Dark overall (low intensity) + reddish
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    _, dark_mask = cv2.threshold(gray, 80, 255, cv2.THRESH_BINARY_INV)
    raw_hem_mask = cv2.bitwise_and(reddish_mask, dark_mask)

    # Exclude vessels
    raw_hem_mask = cv2.bitwise_and(raw_hem_mask, cv2.bitwise_not(vessel_mask))

    # Morphological cleanup
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    raw_hem_mask = cv2.morphologyEx(raw_hem_mask, cv2.MORPH_OPEN, k)

    retinal_mask = _get_retinal_mask(gray)
    hem_mask     = cv2.bitwise_and(raw_hem_mask, retinal_mask)

    # Classify each blob
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(hem_mask, connectivity=8)

    hem_mask_final = np.zeros_like(gray)
    dot_blot_count = 0
    flame_count    = 0

    for i in range(1, num_labels):
        area = stats[i, cv2.CC_STAT_AREA]
        if area < 50:  # Too small — skip
            continue
        w    = stats[i, cv2.CC_STAT_WIDTH]
        h_st = stats[i, cv2.CC_STAT_HEIGHT]
        aspect = (w / h_st) if h_st > 0 else 1.0

        hem_mask_final[labels == i] = 255

        # Flame: elongated (aspect ratio > 2) → follows nerve fiber layer
        # Dot-blot: compact (aspect ≈ 1) → deep retinal layers
        if aspect > 2.0 or aspect < 0.5:
            flame_count += 1
        else:
            dot_blot_count += 1

    total_hem = dot_blot_count + flame_count
    if total_hem == 0:
        hem_type = "none"
    elif flame_count > 0 and dot_blot_count > 0:
        hem_type = "mixed"
    elif flame_count > 0:
        hem_type = "flame"
    else:
        hem_type = "dot-blot"

    return total_hem, hem_type, hem_mask_final


# ─────────────────────────────────────────────────────────────────────────────
# 7. NEOVASCULARIZATION INDICATOR
# ─────────────────────────────────────────────────────────────────────────────

def detect_neovascularization(
    vessel_mask: np.ndarray,
    od_center:   Optional[Tuple[int,int]],
    od_radius:   Optional[int],
) -> Tuple[bool, float]:
    """
    Detect neovascularization (NV) as abnormal vessel proliferation near the disc.
    Heuristic: unusually high vessel density in the peri-disc zone.

    Returns (is_nv_present, confidence_0_to_1).
    """
    if od_center is None or od_radius is None:
        return False, 0.0

    h, w   = vessel_mask.shape
    nv_radius = int(od_radius * 2.5)
    roi_mask  = np.zeros((h, w), dtype=np.uint8)
    cv2.circle(roi_mask, od_center, nv_radius, 255, -1)

    # Exclude the OD itself (always vessel-rich)
    cv2.circle(roi_mask, od_center, od_radius, 0, -1)

    peri_disc_vessels = cv2.bitwise_and(vessel_mask, roi_mask)
    roi_area          = int(np.count_nonzero(roi_mask))
    vessel_area_in_roi = int(np.count_nonzero(peri_disc_vessels))

    if roi_area == 0:
        return False, 0.0

    peri_disc_density = vessel_area_in_roi / roi_area

    # NV threshold: peri-disc vessel density > 30 %
    NV_THRESHOLD = 0.30
    confidence   = min(1.0, peri_disc_density / NV_THRESHOLD)
    is_nv        = peri_disc_density > NV_THRESHOLD

    return is_nv, round(confidence, 3)


# ─────────────────────────────────────────────────────────────────────────────
# 8. GRAD-CAM STYLE HEATMAP OVERLAY (from lesion density map)
# ─────────────────────────────────────────────────────────────────────────────

def generate_gradcam_overlay(
    img_bgr:       np.ndarray,
    ma_mask:       np.ndarray,
    exudate_mask:  np.ndarray,
    hemorrhage_mask: np.ndarray,
    vessel_mask:   np.ndarray,
) -> Tuple[np.ndarray, str]:
    """
    Generate a pseudo Grad-CAM heatmap by compositing weighted lesion masks.
    Returns (overlay_bgr, overlay_base64).
    """
    h, w = img_bgr.shape[:2]

    # Weighted accumulation (lesions have higher weight than vessels)
    attention = np.zeros((h, w), dtype=np.float32)
    attention += ma_mask.astype(np.float32)        * 3.0   # MAs → high attention
    attention += hemorrhage_mask.astype(np.float32) * 2.5
    attention += exudate_mask.astype(np.float32)   * 2.0
    attention += vessel_mask.astype(np.float32)    * 0.5

    # Smooth to create heatmap blobs
    attention = cv2.GaussianBlur(attention, (51, 51), 0)

    # Normalize to 0–255
    if attention.max() > 0:
        attention = (attention / attention.max() * 255).astype(np.uint8)
    else:
        attention = np.zeros((h, w), dtype=np.uint8)

    # Apply JET colormap
    heatmap_color = cv2.applyColorMap(attention, cv2.COLORMAP_JET)

    # Blend with original
    overlay = cv2.addWeighted(img_bgr, 0.55, heatmap_color, 0.45, 0)

    _, buf = cv2.imencode('.jpg', overlay, [cv2.IMWRITE_JPEG_QUALITY, 90])
    b64    = "data:image/jpeg;base64," + base64.b64encode(buf).decode('utf-8')

    return overlay, b64


# ─────────────────────────────────────────────────────────────────────────────
# MASK → BASE64
# ─────────────────────────────────────────────────────────────────────────────

def _mask_to_b64(mask: Optional[np.ndarray]) -> str:
    if mask is None:
        return ""
    # Convert grayscale mask to colored overlay
    colored = cv2.applyColorMap(mask, cv2.COLORMAP_HOT)
    _, buf  = cv2.imencode('.png', colored)
    return "data:image/png;base64," + base64.b64encode(buf).decode('utf-8')


# ─────────────────────────────────────────────────────────────────────────────
# MAIN SEGMENTATION PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

def run_segmentation_pipeline(img_bgr: np.ndarray) -> dict:
    """
    Run the full segmentation pipeline on a BGR fundus image.

    Returns a rich dict with all segmentation results and base64 image overlays.
    """
    result = SegmentationResult()

    # 1. OD & Fovea
    result.od_center, result.od_radius = localize_optic_disc(img_bgr)
    result.fovea_center = localize_fovea(img_bgr, result.od_center)

    # 2. Vessels
    result.vessel_mask, result.vessel_density = segment_vessels(img_bgr)

    # 3. Lesions
    result.ma_count, result.ma_mask = detect_microaneurysms(img_bgr)
    result.exudate_area_pct, result.exudate_mask = detect_exudates(
        img_bgr, result.od_center, result.od_radius
    )
    result.hemorrhage_count, result.hemorrhage_type, result.hemorrhage_mask = detect_hemorrhages(
        img_bgr, result.vessel_mask
    )

    # 4. Neovascularization
    result.neovascularization, result.nv_confidence = detect_neovascularization(
        result.vessel_mask, result.od_center, result.od_radius
    )

    # 5. Grad-CAM overlay
    _, gradcam_b64 = generate_gradcam_overlay(
        img_bgr,
        result.ma_mask,
        result.exudate_mask,
        result.hemorrhage_mask,
        result.vessel_mask,
    )

    # Build human-readable summary
    parts = []
    if result.ma_count > 0:
        parts.append(f"{result.ma_count} microaneurysm(s)")
    if result.exudate_area_pct > 0.5:
        parts.append(f"exudates ({result.exudate_area_pct:.1f}% area)")
    if result.hemorrhage_count > 0:
        parts.append(f"{result.hemorrhage_count} hemorrhage(s) [{result.hemorrhage_type}]")
    if result.neovascularization:
        parts.append("neovascularization near disc")
    result.lesion_summary = ", ".join(parts) if parts else "No significant lesions detected"

    return {
        "od_center":             result.od_center,
        "od_radius":             result.od_radius,
        "fovea_center":          result.fovea_center,
        "vessel_density":        round(result.vessel_density, 4),
        "ma_count":              result.ma_count,
        "exudate_area_pct":      result.exudate_area_pct,
        "hemorrhage_count":      result.hemorrhage_count,
        "hemorrhage_type":       result.hemorrhage_type,
        "neovascularization":    result.neovascularization,
        "nv_confidence":         result.nv_confidence,
        "lesion_summary":        result.lesion_summary,
        "gradcam_b64":           gradcam_b64,
        "vessel_mask_b64":       _mask_to_b64(result.vessel_mask),
        "ma_mask_b64":           _mask_to_b64(result.ma_mask),
        "exudate_mask_b64":      _mask_to_b64(result.exudate_mask),
        "hemorrhage_mask_b64":   _mask_to_b64(result.hemorrhage_mask),
        # Keep numpy arrays for DR grader
        "_result_obj":           result,
    }
