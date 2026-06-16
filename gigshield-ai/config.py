"""
GigShield AI — Centralized Configuration
All settings configurable via environment variables with sensible defaults.
"""
import os

# ── Backend API ──────────────────────────────────────────
BACKEND_URL = os.getenv("GIGSHIELD_BACKEND_URL", "http://localhost:8081")
BACKEND_API_BASE = f"{BACKEND_URL}/api/v1"

# ── OpenWeather API ──────────────────────────────────────
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5"

# ── Redis ────────────────────────────────────────────────
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# ── Model Directory ──────────────────────────────────────
MODEL_DIR = os.getenv("MODEL_DIR", "model")

# ── Scheduler ────────────────────────────────────────────
RETRAIN_CRON_DAY = os.getenv("RETRAIN_CRON_DAY", "sun")
RETRAIN_CRON_HOUR = int(os.getenv("RETRAIN_CRON_HOUR", "2"))
RETRAIN_CRON_MINUTE = int(os.getenv("RETRAIN_CRON_MINUTE", "0"))

# ── A/B Testing ──────────────────────────────────────────
AB_TEST_TRAFFIC_PERCENT = float(os.getenv("AB_TEST_TRAFFIC_PERCENT", "10"))

# ── Performance Alerts ───────────────────────────────────
ACCURACY_DROP_THRESHOLD = float(os.getenv("ACCURACY_DROP_THRESHOLD", "0.05"))

# ── Cache ────────────────────────────────────────────────
CACHE_TTL_SECONDS = int(os.getenv("CACHE_TTL_SECONDS", "3600"))
CACHE_MAX_SIZE = int(os.getenv("CACHE_MAX_SIZE", "500"))

# ── Batch ────────────────────────────────────────────────
MAX_BATCH_SIZE = int(os.getenv("MAX_BATCH_SIZE", "100"))

# ── Cities for weather fetch ─────────────────────────────
DEFAULT_CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata"]
