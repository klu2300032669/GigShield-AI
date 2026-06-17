from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# ---- Request Models ----

class EnvironmentalData(BaseModel):
    event_type: str = Field(..., description="Type of event: HEAVY_RAIN, EXTREME_HEAT, HIGH_POLLUTION")
    rainfall_mm: float = Field(0.0, description="Rainfall in mm")
    temperature_c: float = Field(..., description="Temperature in Celsius")
    aqi: int = Field(..., description="Air Quality Index")

class ActivityData(BaseModel):
    online_hours: float = Field(..., description="Hours worker has been active today")
    expected_deliveries: int = Field(..., description="Normal baseline deliveries expected")
    completed_deliveries: int = Field(..., description="Actual completed deliveries")
    delivery_drop_rate: float = Field(..., description="Percentage drop in deliveries")

class RiskPredictionRequest(BaseModel):
    worker_id: int
    city: str
    environmental_data: EnvironmentalData
    activity_data: ActivityData

# ---- Response Models ----

class RiskPredictionResponse(BaseModel):
    success: bool
    risk_score: float = Field(..., description="Probability of income loss disruption (0.0 to 1.0)")
    trigger_claim: bool = Field(..., description="True if automatic claim should be triggered")
    confidence_level: str = Field(..., description="LOW, MEDIUM, HIGH, CRITICAL")
    factors: List[str] = Field(..., description="Key factors driving the prediction")
    model_version: str = Field(..., description="Version of the AI model used")
    feature_importances: Dict[str, float] = Field(default_factory=dict, description="Feature importance scores")
    is_anomaly: bool = Field(False, description="Whether this prediction is flagged as anomalous")
    fallback_used: bool = Field(False, description="Whether fallback rules were used instead of ML model")

# ---- Feedback Models ----

class FeedbackRequest(BaseModel):
    prediction_id: str = Field(..., description="ID of the original prediction")
    worker_id: int
    actual_outcome: bool = Field(..., description="True if disruption actually occurred")
    predicted_outcome: bool = Field(..., description="What the model predicted")
    predicted_score: float = Field(..., description="The model's predicted risk score")
    actual_claim_amount: Optional[float] = None
    weather_data: Optional[Dict] = None
    activity_data: Optional[Dict] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    notes: Optional[str] = None

class FeedbackResponse(BaseModel):
    success: bool
    message: str
    total_feedback_count: int

# ---- Metrics Models ----

class ModelMetrics(BaseModel):
    model_version: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    cv_mean: float
    cv_std: float
    total_predictions: int
    total_feedback: int
    feedback_accuracy: Optional[float] = None
    last_trained: Optional[str] = None
    feature_importances: Dict[str, float] = Field(default_factory=dict)

# ---- Fraud Detection Models ----

class FraudDetectionRequest(BaseModel):
    worker_id: int
    claim_amount: float
    num_claims_30d: int
    avg_claim_amount: float
    rainfall_mm: float = 0.0
    temperature_c: float = 25.0
    aqi: int = 50
    online_hours: float = 0.0
    delivery_drop_rate: float = 0.0

class FraudDetectionResponse(BaseModel):
    is_suspicious: bool
    anomaly_score: float
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    flags: List[str]

# ---- Premium Prediction Models ----

class PremiumPredictionRequest(BaseModel):
    base_premium: float
    city: str
    rainfall_mm: float = 0.0
    temperature_c: float = 25.0
    aqi: int = 50
    risk_level: str = "LOW"
    coverage_type: str = "BASIC"

class PremiumPredictionResponse(BaseModel):
    original_premium: float
    dynamic_premium: float
    risk_multiplier: float
    reasoning: str

# ---- Claim Amount Prediction Models ----

class ClaimAmountRequest(BaseModel):
    worker_id: int
    rainfall_mm: float = 0.0
    temperature_c: float = 25.0
    aqi: int = 50
    online_hours: float = 0.0
    expected_deliveries: int = 0
    completed_deliveries: int = 0
    delivery_drop_rate: float = 0.0
    base_daily_income: float = Field(500.0, description="Worker's estimated daily income")

class ClaimAmountResponse(BaseModel):
    success: bool
    predicted_amount: float = Field(..., description="Predicted claim amount in INR")
    confidence: str  # LOW, MEDIUM, HIGH
    factors: List[str]
    model_used: str = "gradient_boosting"

# ---- NLP Analysis Models ----

class NLPAnalysisRequest(BaseModel):
    claim_id: Optional[int] = None
    description: str = Field(..., description="Free-text claim description from worker")

class NLPAnalysisResponse(BaseModel):
    success: bool
    sentiment: str  # POSITIVE, NEUTRAL, NEGATIVE
    urgency: str  # LOW, MEDIUM, HIGH, CRITICAL
    keywords: List[str]
    category: str  # WEATHER, HEALTH, ACCIDENT, OTHER
    summary: str

# ---- New API Response Models ----

class ModelInfo(BaseModel):
    version: str
    timestamp: str
    is_current: bool
    metrics: Dict[str, float]

class ModelListResponse(BaseModel):
    current_version: str
    available_versions: List[ModelInfo]

class RollbackResponse(BaseModel):
    success: bool
    message: str
    previous_version: str
    new_version: str

class CompareResponse(BaseModel):
    model1: str
    model2: str
    metrics1: Dict[str, float]
    metrics2: Dict[str, float]
    improvement: Dict[str, float]

class DriftDetectionResponse(BaseModel):
    drift_detected: bool
    drifted_features: List[str]
    details: Dict[str, Any]
    timestamp: str

class ExplainRequest(BaseModel):
    prediction_id: Optional[str] = None
    features: Dict[str, float] = Field(..., description="Feature values to explain")

class ExplainResponse(BaseModel):
    success: bool
    shap_values: Dict[str, float]
    base_value: float
    explanation_summary: List[str]
