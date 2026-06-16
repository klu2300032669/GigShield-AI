from fastapi import FastAPI, HTTPException  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
import joblib  # type: ignore
import pandas as pd  # type: ignore
import numpy as np  # type: ignore
import os
import json
import uuid
import uvicorn  # type: ignore
import logging
import threading
import time
from datetime import datetime
from typing import Dict, Optional, List, Any

from schemas import (  # type: ignore
    RiskPredictionRequest, RiskPredictionResponse,
    FeedbackRequest, FeedbackResponse, ModelMetrics,
    FraudDetectionRequest, FraudDetectionResponse,
    ClaimAmountRequest, ClaimAmountResponse,
    NLPAnalysisRequest, NLPAnalysisResponse,
    ModelInfo, ModelListResponse, RollbackResponse,
    CompareResponse, ExplainRequest, ExplainResponse, DriftDetectionResponse
)

# Optional Advanced Libraries
try:
    import shap  # type: ignore
    HAS_SHAP = True
except ImportError:
    HAS_SHAP = False

try:
    from transformers import pipeline  # type: ignore
    HAS_TRANSFORMERS = True
    nlp_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased")
except Exception:
    HAS_TRANSFORMERS = False
    nlp_pipeline = None

# Global State Dictionary
app_state = {
    "prediction_count": 0
}

# Configure structured logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s - %(message)s')
logger = logging.getLogger("gigshield-ai")

app = FastAPI(
    title="GigShield AI Prediction Service",
    description="Multi-model AI service with XGBoost, Random Forest, Gradient Boosting, Isolation Forest, LSTM, and ARIMA.",
    version="3.1.0"
)

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

# ============================================
# Global Model State & Cache
# ============================================

MODEL_DIR = "model"
active_version_dir = ""

risk_model = None
fraud_model = None
claim_amount_model = None
anomaly_model = None
model_metadata: Dict = {}
feedback_store: List[Dict[str, Any]] = []

CACHE_TTL_SECONDS = 3600
class TTLCache:
    def __init__(self, max_size: int = 500, ttl: int = 3600):
        self.max_size = max_size
        self.ttl = ttl
        self.cache: Dict[str, dict] = {}
        self.lock = threading.Lock()

    def get(self, key: str):
        with self.lock:
            if key in self.cache:
                entry = self.cache[key]
                if time.time() - entry["timestamp"] < self.ttl:
                    return entry["value"]
                else:
                    self.cache.pop(key, None)
        return None

    def set(self, key: str, value: dict):
        with self.lock:
            self.cache[key] = {"value": value, "timestamp": time.time()}
            if len(self.cache) > self.max_size:
                self.cache.pop(next(iter(self.cache)))

prediction_cache = TTLCache(max_size=500, ttl=CACHE_TTL_SECONDS)


# ============================================
# Model Loading & Fallback
# ============================================

def load_active_models():
    global risk_model, fraud_model, claim_amount_model, anomaly_model, model_metadata, active_version_dir
    
    current_pointer = os.path.join(MODEL_DIR, "current.json")
    if os.path.exists(current_pointer):
        try:
            with open(current_pointer, 'r') as f:
                data = json.load(f)
                active_version_dir = data.get("active_version_dir", "")
        except Exception as e:
            logger.error(f"Error reading current.json: {e}")
            active_version_dir = ""
    else:
        # fallback to the latest version by timestamp
        versions = sorted([d for d in os.listdir(MODEL_DIR) if d.startswith("v")])
        if versions:
            active_version_dir = versions[-1]
            logger.info(f"No current.json found. Defaulting to latest timestamp: {active_version_dir}")

    if not active_version_dir:
        logger.warning("No model versions found. Using FALLBACK engine entirely.")
        return

    base_path = os.path.join(MODEL_DIR, active_version_dir)
    logger.info(f"Loading models from {base_path}...")
    
    # Load Risk Model (XGBoost)
    if os.path.exists(os.path.join(base_path, "risk_model.joblib")):
        risk_model = joblib.load(os.path.join(base_path, "risk_model.joblib"))
    else:
        risk_model = None
        
    # Load Fraud Model (RandomForest)
    if os.path.exists(os.path.join(base_path, "fraud_model.joblib")):
        fraud_model = joblib.load(os.path.join(base_path, "fraud_model.joblib"))
    else:
        fraud_model = None

    # Load Claim Amount Model (GradientBoosting)
    if os.path.exists(os.path.join(base_path, "claim_amount_model.joblib")):
        claim_amount_model = joblib.load(os.path.join(base_path, "claim_amount_model.joblib"))
    else:
        claim_amount_model = None

    # Load Anomaly Model (IsolationForest)
    if os.path.exists(os.path.join(base_path, "anomaly_model.joblib")):
        anomaly_model = joblib.load(os.path.join(base_path, "anomaly_model.joblib"))
    else:
        anomaly_model = None

    # Metadata
    if os.path.exists(os.path.join(base_path, "metadata.json")):
        with open(os.path.join(base_path, "metadata.json"), 'r') as f:
            model_metadata = json.load(f)
    else:
        model_metadata = {}

    # Load Feedback
    global feedback_store
    feedback_file = os.path.join(MODEL_DIR, "feedback.jsonl")
    feedback_store = []
    if os.path.exists(feedback_file):
        with open(feedback_file, 'r') as f:
            for line in f:
                try:
                    feedback_store.append(json.loads(line))
                except:
                    pass

    logger.info("Models loaded successfully.")


_startup_time: float = 0.0

@app.on_event("startup")
async def startup_event():
    global _startup_time
    _startup_time = time.time()
    load_active_models()


@app.get("/health")
async def health_check():
    """Health check endpoint - used by the frontend AI status widget."""
    uptime_seconds = int(time.time() - _startup_time)
    hours, rem = divmod(uptime_seconds, 3600)
    minutes, secs = divmod(rem, 60)
    return {
        "status": "ok",
        "service": "GigShield AI Prediction Service",
        "version": "3.1.0",
        "active_version": active_version_dir or "FALLBACK",
        "models_loaded": {
            "risk_model": risk_model is not None,
            "fraud_model": fraud_model is not None,
            "claim_amount_model": claim_amount_model is not None,
            "anomaly_model": anomaly_model is not None,
        },
        "uptime": f"{hours}h {minutes}m {secs}s",
        "uptime_seconds": uptime_seconds,
        "total_predictions": app_state["prediction_count"],
        "timestamp": datetime.now().isoformat(),
    }


# ============================================
# Main Prediction Endpoints
# ============================================

@app.post("/predict", response_model=RiskPredictionResponse)
async def predict_risk(request: RiskPredictionRequest):
    env = request.environmental_data
    act = request.activity_data
    cache_key = f"{env.rainfall_mm}_{env.temperature_c}_{env.aqi}_{act.online_hours}_{act.expected_deliveries}_{act.completed_deliveries}_{act.delivery_drop_rate}"
    
    cached = prediction_cache.get(cache_key)
    if cached:
        return RiskPredictionResponse(**cached)

    app_state["prediction_count"] += 1

    if risk_model is None:
        return _fallback_prediction(request)

    features = pd.DataFrame([{
        'rainfall_mm': env.rainfall_mm,
        'temperature_c': env.temperature_c,
        'aqi': env.aqi,
        'online_hours': act.online_hours,
        'expected_deliveries': act.expected_deliveries,
        'completed_deliveries': act.completed_deliveries,
        'delivery_drop_rate': act.delivery_drop_rate
    }])

    try:
        if hasattr(risk_model, 'predict_proba'):
            probs = risk_model.predict_proba(features)[0]
            risk_score = float(probs[1])
        else:
            risk_score = float(risk_model.predict(features)[0]) # fallback

        trigger_claim = risk_score >= 0.70
        confidence = "CRITICAL" if risk_score >= 0.9 else "HIGH" if risk_score >= 0.7 else "MEDIUM" if risk_score >= 0.4 else "LOW"
        
        is_anomaly = False
        if anomaly_model:
            iso_pred = anomaly_model.predict(features)[0]
            if iso_pred == -1:
                is_anomaly = True
                
        factors = _compute_factors(env, act, risk_score)
        if is_anomaly: factors.append("⚠️ Anomalous behaviour detected (Isolation Forest)")
        
        feature_importance = model_metadata.get("feature_importances", {})

        result = RiskPredictionResponse(
            success=True, risk_score=round(risk_score, 4), trigger_claim=trigger_claim, # type: ignore
            confidence_level=confidence, factors=factors, model_version=active_version_dir,
            feature_importances=feature_importance, is_anomaly=is_anomaly, fallback_used=False
        )

        prediction_cache.set(cache_key, result.model_dump())
        return result

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return _fallback_prediction(request)

@app.post("/detect-fraud", response_model=FraudDetectionResponse)
async def detect_fraud(request: FraudDetectionRequest):
    flags = []
    anomaly_score = 0.0

    # Rule checks
    if request.num_claims_30d > 5:
        flags.append(f"High claim frequency: {request.num_claims_30d} claims/30d")
        anomaly_score += 0.3
    if request.claim_amount > request.avg_claim_amount * 3:
        flags.append("Claim amount 3x above average")
        anomaly_score += 0.3

    # ML checks
    if fraud_model is not None and anomaly_model is not None:
        features = pd.DataFrame([{
            'rainfall_mm': request.rainfall_mm,
            'temperature_c': request.temperature_c,
            'aqi': request.aqi,
            'online_hours': request.online_hours,
            'expected_deliveries': 1,
            'completed_deliveries': 1,
            'delivery_drop_rate': request.delivery_drop_rate
        }])
        
        try:
            fraud_prob = fraud_model.predict_proba(features)[0][1]
            if fraud_prob > 0.6:
                flags.append(f"Random Forest tagged as risky (Confidence: {fraud_prob:.2f})")
                anomaly_score += float(fraud_prob) * 0.5
                
            iso_pred = anomaly_model.predict(features)[0]
            if iso_pred == -1:
                flags.append("Isolation Forest detected severe anomaly")
                anomaly_score += 0.4
        except Exception as e:
            logger.error(f"Fraud model error: {e}")

    anomaly_score = min(1.0, anomaly_score)
    risk_level = "CRITICAL" if anomaly_score >= 0.7 else "HIGH" if anomaly_score >= 0.5 else "MEDIUM" if anomaly_score >= 0.3 else "LOW"
    
    if not flags: flags.append("No suspicious patterns detected")

    return FraudDetectionResponse(
        is_suspicious=anomaly_score >= 0.5, anomaly_score=round(anomaly_score, 4), # type: ignore
        risk_level=risk_level, flags=flags
    )

@app.post("/predict-claim-amount", response_model=ClaimAmountResponse)
async def predict_claim_amount(request: ClaimAmountRequest):
    if claim_amount_model is not None:
        features = pd.DataFrame([{
            'rainfall_mm': request.rainfall_mm,
            'temperature_c': request.temperature_c,
            'aqi': request.aqi,
            'online_hours': request.online_hours,
            'expected_deliveries': request.expected_deliveries,
            'completed_deliveries': request.completed_deliveries,
            'delivery_drop_rate': request.delivery_drop_rate
        }])
        predicted_amount = float(claim_amount_model.predict(features)[0])
        return ClaimAmountResponse(
            success=True, predicted_amount=round(predicted_amount, 2), # type: ignore
            confidence="HIGH", factors=["ML Gradient Boosting Prediction"], model_used="GradientBoosting"
        )
    else:
        # Fallback
        multiplier = 1.0 + (request.delivery_drop_rate / 100) + (request.rainfall_mm / 100)
        return ClaimAmountResponse(
            success=True, predicted_amount=round(request.base_daily_income * multiplier, 2), # type: ignore
            confidence="LOW", factors=["Rule-based Fallback Computation"], model_used="Fallback_Rules"
        )


@app.post("/analyze-description", response_model=NLPAnalysisResponse)
async def analyze_description(request: NLPAnalysisRequest):
    category = "OTHER"
    if "rain" in request.description.lower() or "flood" in request.description.lower():
        category = "WEATHER"
    elif "accident" in request.description.lower():
        category = "HEALTH"

    result = NLPAnalysisResponse(
        success=True, sentiment="NEUTRAL", urgency="MEDIUM", keywords=[], category=category,
        summary=request.description[:50] + "..."
    )

    if HAS_TRANSFORMERS and nlp_pipeline:
        try:
            res = nlp_pipeline(request.description[:512])[0] # type: ignore
            result.sentiment = "POSITIVE" if res["label"] == "POSITIVE" else "NEGATIVE"
        except Exception as e:
            logger.error(f"Transformers error: {e}")
            
    return result

# ============================================
# Advanced MLOps Endpoints
# ============================================

@app.get("/models", response_model=ModelListResponse)
async def list_models():
    versions = []
    current_pointer = os.path.join(MODEL_DIR, "current.json")
    current_version_id = ""
    if os.path.exists(current_pointer):
        with open(current_pointer, 'r') as f:
            current_version_id = json.load(f).get("active_version_dir", "")
            
    dirs = [d for d in os.listdir(MODEL_DIR) if os.path.isdir(os.path.join(MODEL_DIR, d)) and d.startswith("v")]
    for d in sorted(dirs, reverse=True):
        meta_path = os.path.join(MODEL_DIR, d, "metadata.json")
        metrics = {}
        timestamp = d.split('_', 1)[1] if '_' in d else "unknown"  # type: ignore
        if os.path.exists(meta_path):
            with open(meta_path, 'r') as f:
                mData = json.load(f)
                metrics = mData.get("metrics", {})
        versions.append(ModelInfo(
            version=d, timestamp=timestamp, is_current=(d == current_version_id), metrics=metrics
        ))
    return ModelListResponse(current_version=current_version_id, available_versions=versions)


@app.post("/models/rollback/{version_id}", response_model=RollbackResponse)
async def rollback_model(version_id: str):
    target_dir = os.path.join(MODEL_DIR, version_id)
    if not os.path.isdir(target_dir):
        raise HTTPException(status_code=404, detail="Version not found")
        
    current_pointer = os.path.join(MODEL_DIR, "current.json")
    with open(current_pointer, 'w') as f:
        json.dump({"active_version_dir": version_id}, f)
        
    load_active_models()
    prediction_cache.cache.clear()
    
    return RollbackResponse(
        success=True, message=f"Successfully rolled back to {version_id}",
        previous_version=active_version_dir, new_version=version_id
    )

@app.get("/models/compare/{id1}/{id2}", response_model=CompareResponse)
async def compare_models(id1: str, id2: str):
    m1_path = os.path.join(MODEL_DIR, id1, "metadata.json")
    m2_path = os.path.join(MODEL_DIR, id2, "metadata.json")
    if not os.path.exists(m1_path) or not os.path.exists(m2_path):
        raise HTTPException(status_code=404, detail="One or both metadata files not found")
        
    with open(m1_path, 'r') as f: m1 = json.load(f).get("metrics", {})
    with open(m2_path, 'r') as f: m2 = json.load(f).get("metrics", {})
    
    improvement = {}
    for k in m1.keys():
        if k in m2:
            improvement[k] = m2[k] - m1[k]

    return CompareResponse(model1=id1, model2=id2, metrics1=m1, metrics2=m2, improvement=improvement)

@app.post("/admin/retrain")
async def trigger_retrain():
    try:
        import subprocess, sys
        subprocess.Popen([sys.executable, "model_trainer.py"], cwd=os.path.dirname(os.path.abspath(__file__)))
        return {"success": True, "message": "Background retraining pipeline triggered using 80% real data + 20% synth"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain", response_model=ExplainResponse)
async def explain_prediction(request: ExplainRequest):
    if risk_model is None or not HAS_SHAP:
        raise HTTPException(status_code=500, detail="SHAP not installed or Risk Model not loaded.")
        
    features = pd.DataFrame([request.features])
    
    try:
        explainer = shap.TreeExplainer(risk_model)
        shap_values = explainer.shap_values(features)
        
        # XGBoost output depends on version/config
        if isinstance(shap_values, list):
            sv = shap_values[1][0]
        else:
            sv = shap_values[0]
            
        sv_dict = {feat: float(val) for feat, val in zip(request.features.keys(), sv)}
        return ExplainResponse(
            success=True, shap_values=sv_dict, base_value=float(explainer.expected_value), # type: ignore
            explanation_summary=["Higher negative SHAP = decreases risk", "Higher positive SHAP = increases risk"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Explainability Error: {e}")

@app.get("/drift-detection", response_model=DriftDetectionResponse)
async def drift_detection():
    # Naive drift detection: if feedback target var mean diverges significantly from training mean
    target_mean_train = model_metadata.get("training_data_splits", {}).get("disruption_rate", 0.5)
    
    recent_feedbacks = feedback_store[-100:]  # type: ignore
    if not recent_feedbacks:
        return DriftDetectionResponse(drift_detected=False, drifted_features=[], details={"msg": "Not enough feedback data"}, timestamp=datetime.now().isoformat())
        
    actuals = [f["actual_outcome"] for f in recent_feedbacks if "actual_outcome" in f]
    if len(actuals) < 10:
        return DriftDetectionResponse(drift_detected=False, drifted_features=[], details={"msg": "Not enough actual outcomes"}, timestamp=datetime.now().isoformat())
        
    actual_mean = sum(actuals) / len(actuals)
    drift = False
    details = {"training_mean": target_mean_train, "production_mean": actual_mean}
    
    if abs(actual_mean - target_mean_train) > 0.2:
        drift = True
        
    return DriftDetectionResponse(drift_detected=drift, drifted_features=["is_disrupted (Target Variable)"], details=details, timestamp=datetime.now().isoformat())

# ============================================
# Metrics & Feedback
# ============================================

@app.get("/metrics/real-time")
async def real_time_metrics():
    return {
        "cache_hits_available": True,
        "total_predictions_since_restart": app_state["prediction_count"],
        "cache_size": len(prediction_cache.cache),
        "recent_feedback_count": len(feedback_store[-50:]),  # type: ignore
    }

@app.get("/metrics/historical", response_model=ModelMetrics)
async def get_metrics():
    metrics = model_metadata.get("metrics", {})
    return ModelMetrics(
        model_version=active_version_dir,
        accuracy=metrics.get("risk_accuracy", 0.0), precision=metrics.get("risk_precision", 0.0),
        recall=metrics.get("risk_recall", 0.0), f1_score=metrics.get("risk_f1", 0.0),
        cv_mean=metrics.get("cv_mean", 0.0), cv_std=metrics.get("cv_std", 0.0),
        total_predictions=app_state["prediction_count"], total_feedback=len(feedback_store),
        feature_importances=model_metadata.get("feature_importances", {})
    )

@app.get("/feature-importance")
async def feature_importance():
    return model_metadata.get("feature_importances", {})

@app.post("/feedback/batch")
async def submit_batch_feedback(requests: List[FeedbackRequest]):
    global feedback_store
    added = 0
    feedback_file = os.path.join(MODEL_DIR, "feedback.jsonl")
    with open(feedback_file, 'a') as f:
        for req in requests:
            entry = req.model_dump()
            entry["id"] = str(uuid.uuid4())
            feedback_store.append(entry)
            f.write(json.dumps(entry) + "\n")
            added += 1
            
    return {"success": True, "added": added, "total": len(feedback_store)}

@app.get("/feedback/stats")
async def feedback_stats():
    total = len(feedback_store)
    if total == 0: return {"total": 0, "accuracy": 0}
    
    correct = sum(1 for fb in feedback_store if fb.get("actual_outcome") == fb.get("predicted_outcome"))
    return {"total": total, "accuracy": correct / total}


def _compute_factors(env, act, risk_score: float) -> list:
    factors = []
    if act.delivery_drop_rate > 50: factors.append(f"Severe delivery drop rate ({act.delivery_drop_rate}%)")
    elif act.delivery_drop_rate > 30: factors.append(f"Moderate delivery drop rate ({act.delivery_drop_rate}%)")

    if env.rainfall_mm > 30: factors.append(f"Heavy rainfall ({env.rainfall_mm}mm)")
    if env.temperature_c > 42: factors.append(f"Extreme heat ({env.temperature_c}°C)")
    if env.aqi > 300: factors.append(f"Hazardous air quality (AQI {env.aqi})")

    if not factors: factors.append("Normal conditions")
    return factors

def _fallback_prediction(request: RiskPredictionRequest) -> RiskPredictionResponse:
    env = request.environmental_data
    act = request.activity_data
    risk_score = 0.0
    if env.rainfall_mm > 40: risk_score += 0.30
    if env.temperature_c > 42: risk_score += 0.20
    if act.delivery_drop_rate > 50: risk_score += 0.30
    
    risk_score = min(1.0, risk_score)
    confidence = "CRITICAL" if risk_score >= 0.9 else "HIGH" if risk_score >= 0.7 else "MEDIUM" if risk_score >= 0.4 else "LOW"

    return RiskPredictionResponse(
        success=True, risk_score=round(risk_score, 4), trigger_claim=risk_score >= 0.70, # type: ignore
        confidence_level=confidence, factors=["[Fallback Engine utilized]"], model_version="FALLBACK-1.0",
        feature_importances={}, is_anomaly=False, fallback_used=True
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
