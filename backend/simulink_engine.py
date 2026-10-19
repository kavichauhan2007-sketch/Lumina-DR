"""
simulink_engine.py
-------------------
MathWorks PS-26038: Lumina DR — District-Level Telemedicine Pipeline Simulation Engine

Models:
  - Image acquisition rate at Primary Health Centres (PHCs)
  - Network bandwidth constraints (2G / 3G / 4G / Satellite)
  - Edge vs. cloud processing latency & throughput
  - Doctor review capacity and queue delay
  - Annual population screening throughput
  - Bottleneck identification and resource optimization

This is the Python implementation of the mathematical model that mirrors the
MATLAB/Simulink simulation in matlab/telemedicine_simulink_model.m
"""

import math
import random
from typing import Literal
from dataclasses import dataclass, field


# ─────────────────────────────────────────────────────────────────────────────
# NETWORK PARAMETERS  (bandwidth in Mbps, latency in ms)
# ─────────────────────────────────────────────────────────────────────────────

NETWORK_PROFILES = {
    "2G": {
        "bandwidth_mbps":   0.2,
        "latency_ms":       500,
        "packet_loss_pct":  8.0,
        "reliability":      0.80,
    },
    "3G": {
        "bandwidth_mbps":   2.0,
        "latency_ms":       150,
        "packet_loss_pct":  3.0,
        "reliability":      0.90,
    },
    "4G": {
        "bandwidth_mbps":   20.0,
        "latency_ms":       40,
        "packet_loss_pct":  0.5,
        "reliability":      0.97,
    },
    "Satellite": {
        "bandwidth_mbps":   5.0,
        "latency_ms":       620,
        "packet_loss_pct":  2.0,
        "reliability":      0.92,
    },
}

# Average fundus image size in MB (JPEG after CLAHE compression)
AVG_IMAGE_SIZE_MB = 0.8

# Average AI processing time (seconds) on edge device vs. cloud
EDGE_PROCESSING_SEC   = 8.0    # Raspberry Pi / Jetson Nano equivalent
CLOUD_PROCESSING_SEC  = 2.0    # GPU server

# Working hours per day for a camera operator
WORKING_HOURS_PER_DAY = 8
PATIENT_SETUP_SEC     = 120    # Time to prepare a patient (positioning, dilation)

# Doctor review time (human-in-loop) seconds per case
DOCTOR_REVIEW_SEC     = 30     # Targeted: sub-30-second review

# Annual operating days (typical rural health calendar)
OPERATING_DAYS_PER_YEAR = 300


# ─────────────────────────────────────────────────────────────────────────────
# DATA CONTAINERS
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class SimulationResult:
    # Inputs
    population:          int
    num_phcs:            int
    network_type:        str
    processing_mode:     str
    doctors_available:   int
    daily_camera_hours:  float

    # Outputs
    images_per_phc_per_day:     float = 0.0
    total_images_per_day:       float = 0.0
    total_images_per_year:      float = 0.0
    transmission_time_sec:      float = 0.0
    processing_time_sec:        float = 0.0
    doctor_review_time_sec:     float = 0.0
    total_cycle_time_sec:       float = 0.0
    queue_wait_time_sec:        float = 0.0
    effective_throughput_pct:   float = 0.0
    annual_coverage_pct:        float = 0.0
    bottleneck:                 str   = ""
    bottleneck_detail:          str   = ""
    optimization_suggestions:  list  = field(default_factory=list)
    time_series:                list  = field(default_factory=list)   # for charts
    phc_stats:                  list  = field(default_factory=list)


# ─────────────────────────────────────────────────────────────────────────────
# CORE SIMULATION MATH
# ─────────────────────────────────────────────────────────────────────────────

def _compute_transmission_time(network_type: str) -> float:
    """Calculate image transmission time (seconds) for given network."""
    profile = NETWORK_PROFILES.get(network_type, NETWORK_PROFILES["3G"])
    bw_mbps     = profile["bandwidth_mbps"]
    latency_ms  = profile["latency_ms"]
    image_mb    = AVG_IMAGE_SIZE_MB
    # Effective bandwidth with packet loss
    effective_bw = bw_mbps * (1 - profile["packet_loss_pct"] / 100)
    transfer_sec = (image_mb * 8) / max(effective_bw, 0.01)  # Mbits / Mbps
    total_sec    = transfer_sec + (latency_ms / 1000)
    return round(total_sec, 2)


def _compute_processing_time(mode: str) -> float:
    """Processing time (seconds) for AI analysis."""
    if mode == "edge":
        return EDGE_PROCESSING_SEC
    elif mode == "cloud":
        return CLOUD_PROCESSING_SEC
    else:
        # Hybrid: transmit then cloud process
        return CLOUD_PROCESSING_SEC + 1.0


def _compute_doctor_capacity_per_day(doctors: int, review_sec: float) -> float:
    """Maximum cases a doctor cohort can review per day."""
    # Assume doctor spends 60% of working time on reviews
    effective_review_hours = WORKING_HOURS_PER_DAY * 0.6
    cases_per_doctor = (effective_review_hours * 3600) / review_sec
    return cases_per_doctor * doctors


def _compute_camera_throughput(daily_hours: float) -> float:
    """Patients that can be imaged per PHC per day given camera hours."""
    seconds_available = daily_hours * 3600
    return seconds_available / PATIENT_SETUP_SEC


def _identify_bottleneck(result: SimulationResult) -> tuple:
    """Identify the pipeline bottleneck stage."""
    cycle_stages = {
        "Patient Setup":       PATIENT_SETUP_SEC,
        "Image Transmission":  result.transmission_time_sec,
        "AI Processing":       result.processing_time_sec,
        "Doctor Review":       result.doctor_review_time_sec,
    }

    bottleneck_stage  = max(cycle_stages, key=cycle_stages.get)
    bottleneck_detail = f"{bottleneck_stage}: {cycle_stages[bottleneck_stage]:.0f}s per case"

    suggestions = []
    if bottleneck_stage == "Image Transmission":
        suggestions.append("Upgrade to 4G LTE or satellite broadband at PHCs.")
        suggestions.append("Deploy edge processing to eliminate transmission overhead.")
        suggestions.append("Use JPEG 2000 lossless compression to reduce image size by 40%.")
    elif bottleneck_stage == "Patient Setup":
        suggestions.append("Train dedicated camera operators with fundus photography protocols.")
        suggestions.append("Invest in non-mydriatic cameras to eliminate dilation wait time.")
        suggestions.append("Pre-register patients to reduce administrative delays.")
    elif bottleneck_stage == "AI Processing":
        suggestions.append("Deploy Jetson Nano / Raspberry Pi 4 edge inference units at PHCs.")
        suggestions.append("Upgrade to cloud GPU cluster for sub-2s processing.")
    elif bottleneck_stage == "Doctor Review":
        suggestions.append("Increase ophthalmologist coverage with tele-retina specialists.")
        suggestions.append("Implement AI pre-triage: auto-approve Level 0 (No DR) cases.")
        suggestions.append("Use asynchronous review model: batch cases for morning rounds.")

    return bottleneck_stage, bottleneck_detail, suggestions


def _generate_time_series(days: int = 30, base_patients: float = 50.0) -> list:
    """Generate synthetic daily screening time-series data for charts."""
    data = []
    for d in range(1, days + 1):
        noise          = random.gauss(0, base_patients * 0.08)
        weekend_factor = 0.5 if d % 7 in (0, 6) else 1.0
        patients_day   = max(0, (base_patients + noise) * weekend_factor)
        data.append({
            "day":           d,
            "patients":      round(patients_day, 0),
            "coverage":      round(patients_day / max(1, base_patients) * 100, 1),
            "queue":         round(max(0, patients_day - base_patients * 0.9), 0),
        })
    return data


def _generate_phc_stats(num_phcs: int, images_per_phc: float) -> list:
    """Per-PHC simulation statistics."""
    stats = []
    names = [
        "Rampur PHC", "Bhimpur PHC", "Saraswati PHC", "Ganga Nagar PHC",
        "Kothi PHC", "Motipur PHC", "Dev Nagar PHC", "Lakshmipur PHC",
        "Krishnapur PHC", "Sundarbans PHC",
    ]
    for i in range(num_phcs):
        name     = names[i % len(names)]
        variance = random.gauss(1.0, 0.15)
        throughput = max(5, round(images_per_phc * variance, 0))
        stats.append({
            "phc_id":          f"PHC-{100 + i + 1}",
            "name":            name,
            "daily_throughput": throughput,
            "annual_capacity":  round(throughput * OPERATING_DAYS_PER_YEAR, 0),
            "network_quality":  random.choice(["Excellent", "Good", "Fair", "Poor"]),
        })
    return stats


# ─────────────────────────────────────────────────────────────────────────────
# MAIN SIMULATION ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

def run_telemedicine_simulation(
    population:         int   = 100_000,
    num_phcs:           int   = 5,
    network_type:       str   = "3G",
    processing_mode:    str   = "hybrid",   # "edge" | "cloud" | "hybrid"
    doctors_available:  int   = 2,
    daily_camera_hours: float = 6.0,
    doctor_review_sec:  float = 30.0,
) -> dict:
    """
    Run the district-level telemedicine screening simulation.

    Returns a JSON-serializable dict with all simulation outputs.
    """
    result = SimulationResult(
        population          = population,
        num_phcs            = num_phcs,
        network_type        = network_type,
        processing_mode     = processing_mode,
        doctors_available   = doctors_available,
        daily_camera_hours  = daily_camera_hours,
    )

    # ── Per-case timing breakdown ──────────────────────────────────────────
    result.transmission_time_sec  = _compute_transmission_time(network_type)
    result.processing_time_sec    = _compute_processing_time(processing_mode)
    result.doctor_review_time_sec = doctor_review_sec
    result.total_cycle_time_sec   = (
        PATIENT_SETUP_SEC
        + result.transmission_time_sec
        + result.processing_time_sec
        + result.doctor_review_time_sec
    )

    # ── Throughput ─────────────────────────────────────────────────────────
    camera_capacity_per_phc   = _compute_camera_throughput(daily_camera_hours)
    doctor_capacity_total_day = _compute_doctor_capacity_per_day(doctors_available, doctor_review_sec)

    result.images_per_phc_per_day = camera_capacity_per_phc
    result.total_images_per_day   = camera_capacity_per_phc * num_phcs
    result.total_images_per_year  = result.total_images_per_day * OPERATING_DAYS_PER_YEAR

    # Queue wait time: if acquisition rate > doctor capacity
    if result.total_images_per_day > doctor_capacity_total_day:
        overflow               = result.total_images_per_day - doctor_capacity_total_day
        result.queue_wait_time_sec = (overflow / doctor_capacity_total_day) * WORKING_HOURS_PER_DAY * 3600
    else:
        result.queue_wait_time_sec = 0.0

    # Effective throughput = min(camera, doctor) as fraction
    effective_daily = min(result.total_images_per_day, doctor_capacity_total_day)
    result.effective_throughput_pct = round(
        (effective_daily / max(1, result.total_images_per_day)) * 100, 1
    )

    # Annual population coverage (assume 60% of population at risk needs screening)
    at_risk_population     = population * 0.60
    result.annual_coverage_pct = round(
        min(100.0, result.total_images_per_year / max(1, at_risk_population) * 100), 1
    )

    # ── Bottleneck identification ──────────────────────────────────────────
    bn_stage, bn_detail, suggestions = _identify_bottleneck(result)
    result.bottleneck               = bn_stage
    result.bottleneck_detail        = bn_detail
    result.optimization_suggestions = suggestions

    # ── Time-series data for charts ────────────────────────────────────────
    result.time_series = _generate_time_series(
        days=30, base_patients=result.total_images_per_day
    )

    # ── Per-PHC breakdown ─────────────────────────────────────────────────
    result.phc_stats = _generate_phc_stats(num_phcs, camera_capacity_per_phc)

    # Build bandwidth timeline (mock live chart data)
    network_profile = NETWORK_PROFILES.get(network_type, NETWORK_PROFILES["3G"])
    live_bandwidth  = []
    import datetime, random as _rand
    now = datetime.datetime.utcnow()
    for i in range(7, -1, -1):
        t = (now - datetime.timedelta(minutes=i * 5)).strftime("%H:%M")
        bw_noise   = _rand.gauss(0, network_profile["bandwidth_mbps"] * 0.1)
        lat_noise  = _rand.gauss(0, network_profile["latency_ms"] * 0.05)
        live_bandwidth.append({
            "time":      t,
            "bandwidth": round(max(0.01, network_profile["bandwidth_mbps"] + bw_noise), 2),
            "latency":   round(max(10, network_profile["latency_ms"] + lat_noise), 0),
        })

    return {
        # Inputs echoed back
        "population":                  result.population,
        "num_phcs":                    result.num_phcs,
        "network_type":                result.network_type,
        "processing_mode":             result.processing_mode,
        "doctors_available":           result.doctors_available,
        "daily_camera_hours":          result.daily_camera_hours,

        # Timing (per-case)
        "transmission_time_sec":       result.transmission_time_sec,
        "processing_time_sec":         result.processing_time_sec,
        "doctor_review_time_sec":      result.doctor_review_time_sec,
        "total_cycle_time_sec":        round(result.total_cycle_time_sec, 1),
        "queue_wait_time_sec":         round(result.queue_wait_time_sec, 0),

        # Throughput
        "images_per_phc_per_day":      round(result.images_per_phc_per_day, 0),
        "total_images_per_day":        round(result.total_images_per_day, 0),
        "total_images_per_year":       round(result.total_images_per_year, 0),
        "doctor_capacity_per_day":     round(doctor_capacity_total_day, 0),
        "effective_throughput_pct":    result.effective_throughput_pct,
        "annual_coverage_pct":         result.annual_coverage_pct,

        # Bottleneck
        "bottleneck":                  result.bottleneck,
        "bottleneck_detail":           result.bottleneck_detail,
        "optimization_suggestions":    result.optimization_suggestions,

        # Chart data
        "time_series":                 result.time_series,
        "phc_stats":                   result.phc_stats,
        "live_bandwidth":              live_bandwidth,

        # Network info
        "network_bandwidth_mbps":      network_profile["bandwidth_mbps"],
        "network_latency_ms":          network_profile["latency_ms"],
        "network_reliability_pct":     round(network_profile["reliability"] * 100, 0),
    }
