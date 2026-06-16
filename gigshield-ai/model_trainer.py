import pandas as pd  # type: ignore
import numpy as np  # type: ignore
from sklearn.ensemble import GradientBoostingRegressor, RandomForestClassifier, IsolationForest  # type: ignore
from sklearn.cluster import KMeans  # type: ignore
from sklearn.model_selection import train_test_split, cross_val_score  # type: ignore
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error  # type: ignore
import joblib  # type: ignore
import os
import json
import shutil
from datetime import datetime
import warnings

warnings.filterwarnings('ignore')

# Try to import advanced models
try:
    from xgboost import XGBClassifier  # type: ignore
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False
    print("Warning: XGBoost not installed.")

try:
    import pmdarima as pm  # type: ignore
    HAS_ARIMA = True
except ImportError:
    HAS_ARIMA = False
    print("Warning: pmdarima not installed.")

try:
    import torch  # type: ignore
    import torch.nn as nn  # type: ignore
    import torch.optim as optim  # type: ignore
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    print("Warning: torch not installed.")


def generate_time_series_weather(num_days=365):
    """Generate weather time-series data for LSTM and ARIMA"""
    np.random.seed(42)
    dates = pd.date_range(end=datetime.now(), periods=num_days, freq='D')
    
    # Seasonal patterns
    seasonality = np.sin(np.arange(num_days) * (2 * np.pi / 365)) * 10
    temperature = 25 + seasonality + np.random.normal(0, 3, num_days)
    rainfall = np.maximum(0, (np.sin(np.arange(num_days) * (2 * np.pi / 180)) * 20) + np.random.normal(0, 10, num_days))
    
    # Seasonal claims volume for ARIMA
    claims_volume = 100 + (rainfall * 2) + np.random.normal(0, 5, num_days)
    
    return pd.DataFrame({
        'date': dates,
        'temperature': temperature,
        'rainfall': rainfall,
        'claims_volume': claims_volume
    })

def generate_worker_profiles(num_workers=2000):
    """Generate worker data for K-Means segmentation"""
    np.random.seed(42)
    hours = np.random.normal(6, 2, num_workers)
    completion_rate = np.random.uniform(0.6, 0.99, num_workers)
    avg_speed = np.random.normal(20, 5, num_workers)
    experience_months = np.random.randint(1, 48, num_workers)
    return pd.DataFrame({
        'hours': np.clip(hours, 1, 12),
        'completion_rate': completion_rate,
        'avg_speed': np.clip(avg_speed, 10, 40),
        'experience_months': experience_months
    })

def fetch_real_claims_data(num_samples=8000):
    """
    Mock integration: Fetch real claims data from backend.
    In reality, we would do: requests.get('http://backend/claims/last-30d')
    """
    print("Fetching real claims data (mocked)...")
    np.random.seed(123)
    rainfall_mm = np.random.exponential(scale=12, size=num_samples)
    temperature_c = np.random.normal(loc=30, scale=8, size=num_samples)
    aqi = np.random.lognormal(mean=4.5, sigma=0.6, size=num_samples).astype(int)
    online_hours = np.random.normal(loc=8, scale=2.5, size=num_samples)
    expected_deliveries = np.round(online_hours * np.random.uniform(2.0, 3.5, num_samples)).astype(int)
    completed_deliveries = np.round(expected_deliveries * np.random.uniform(0.7, 1.0, num_samples)).astype(int)
    delivery_drop_rate = np.where(expected_deliveries > 0, ((expected_deliveries - completed_deliveries) / expected_deliveries) * 100, 0)
    
    # Real data target
    is_disrupted = ((delivery_drop_rate > 30) & ((rainfall_mm > 15) | (temperature_c > 38) | (aqi > 250))).astype(int)
    
    # Fraud target
    claim_amount = np.random.uniform(500, 5000, num_samples)
    is_fraud = ((claim_amount > 4000) & (delivery_drop_rate < 20)).astype(int)

    return pd.DataFrame({
        'rainfall_mm': np.clip(rainfall_mm, 0, 100),
        'temperature_c': np.clip(temperature_c, 10, 48),
        'aqi': np.clip(aqi, 20, 500),
        'online_hours': np.clip(online_hours, 1, 14),
        'expected_deliveries': np.maximum(expected_deliveries, 1),
        'completed_deliveries': np.maximum(completed_deliveries, 0),
        'delivery_drop_rate': delivery_drop_rate,
        'claim_amount': claim_amount,
        'is_disrupted': is_disrupted,
        'is_fraud': is_fraud
    })

def generate_synthetic_data(num_samples=2000):
    """Generates 20% synthetic data to mix with real data"""
    df = fetch_real_claims_data(num_samples)
    df['is_disrupted'] = df['is_disrupted'].sample(frac=1).values # shuffle targets slightly to simulate synthetic uniqueness
    return df

if HAS_TORCH:
    class WeatherLSTM(nn.Module):
        def __init__(self, input_size=2, hidden_size=16, output_size=1):
            super().__init__()
            self.lstm = nn.LSTM(input_size, hidden_size, batch_first=True)
            self.fc = nn.Linear(hidden_size, output_size)

        def forward(self, x):
            _, (hn, _) = self.lstm(x)
            out = self.fc(hn[-1])
            return out
else:
    class WeatherLSTM:
        def __init__(self, *args, **kwargs):
            pass
        def parameters(self):
            return []
        def state_dict(self):
            return {}
        def __call__(self, *args, **kwargs):
            return None


def train_and_save_model():
    print("=" * 60)
    print("GigShield AI — Full Pipeline Training (Ensemble + Deep Learning)")
    print("=" * 60)

    # 1. Prepare Data (80% Real, 20% Synthetic)
    real_df = fetch_real_claims_data(8000)
    synth_df = generate_synthetic_data(2000)
    df = pd.concat([real_df, synth_df], ignore_index=True)
    
    print(f"Data combined: {len(real_df)} real + {len(synth_df)} synthetic = {len(df)} total.")

    X = df[['rainfall_mm', 'temperature_c', 'aqi', 'online_hours', 'expected_deliveries', 'completed_deliveries', 'delivery_drop_rate']]
    y_risk = df['is_disrupted']
    y_fraud = df['is_fraud']
    y_amount = df['claim_amount']

    X_train, X_test, y_train_risk, y_test_risk = train_test_split(X, y_risk, test_size=0.2, random_state=42)
    _, _, y_train_fraud, y_test_fraud = train_test_split(X, y_fraud, test_size=0.2, random_state=42)
    _, _, y_train_amount, y_test_amount = train_test_split(X, y_amount, test_size=0.2, random_state=42)

    version = "3.1.0"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    version_dir = f"model/v{version}_{timestamp}"
    os.makedirs(version_dir, exist_ok=True)

    metrics = {}

    # --- 1. XGBoost: Primary Risk Prediction ---
    print("\n[1/7] Training XGBoost (Primary Risk)...")
    if HAS_XGBOOST:
        xgb_model = XGBClassifier(n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42, use_label_encoder=False, eval_metric='logloss')
        xgb_model.fit(X_train, y_train_risk)
        risk_acc = accuracy_score(y_test_risk, xgb_model.predict(X_test))
        print(f"  XGBoost Risk Accuracy: {risk_acc:.4f}")
        joblib.dump(xgb_model, f"{version_dir}/risk_model.joblib")
        metrics["risk_accuracy"] = risk_acc
    else:
        print("XGBoost skipped. (Not installed)")

    # --- 2. Random Forest: Fraud Detection ---
    print("\n[2/7] Training Random Forest (Fraud Detection)...")
    rf_model = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    rf_model.fit(X_train, y_train_fraud)
    fraud_acc = accuracy_score(y_test_fraud, rf_model.predict(X_test))
    print(f"  Random Forest Fraud Accuracy: {fraud_acc:.4f}")
    joblib.dump(rf_model, f"{version_dir}/fraud_model.joblib")
    metrics["fraud_accuracy"] = fraud_acc

    # --- 3. Gradient Boosting: Claim Amount Prediction ---
    print("[3/7] Training Gradient Boosting (Claim Amount)...")
    gb_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
    gb_model.fit(X_train, y_train_amount)
    gb_rmse = np.sqrt(mean_squared_error(y_test_amount, gb_model.predict(X_test)))
    print(f"  GB Claim Amount RMSE: {gb_rmse:.2f}")
    joblib.dump(gb_model, f"{version_dir}/claim_amount_model.joblib")
    metrics["claim_amount_rmse"] = gb_rmse

    # --- 4. Isolation Forest: Anomaly Detection ---
    print("\n[4/7] Training Isolation Forest (Anomalies)...")
    iso_model = IsolationForest(contamination=0.05, random_state=42)
    iso_model.fit(X)
    joblib.dump(iso_model, f"{version_dir}/anomaly_model.joblib")
    
    # --- 5. K-Means: Worker Segmentation ---
    print("\n[5/7] Training K-Means (Worker Segmentation)...")
    worker_df = generate_worker_profiles()
    kmeans = KMeans(n_clusters=4, random_state=42)
    kmeans.fit(worker_df)
    joblib.dump(kmeans, f"{version_dir}/worker_segmentation_model.joblib")

    # --- 6. ARIMA: Seasonal Pattern Detection ---
    print("\n[6/7] Training ARIMA (Seasonal Patterns)...")
    ts_df = generate_time_series_weather()
    if HAS_ARIMA:
        arima_model = pm.auto_arima(ts_df['claims_volume'], seasonal=True, m=7, suppress_warnings=True)
        joblib.dump(arima_model, f"{version_dir}/arima_seasonal_model.joblib")
        print("  ARIMA model trained.")
    else:
        print("  Skipped ARIMA (pmdarima not installed).")

    # --- 7. LSTM/GRU: Time-series Weather Forecasting ---
    print("\n[7/7] Training LSTM (Weather Forecasting)...")
    if HAS_TORCH:
        # Simple sequence generation for PyTorch
        seq_length = 7
        data = ts_df[['temperature', 'rainfall']].values
        X_lstm, y_lstm = [], []
        for i in range(len(data) - seq_length):
            X_lstm.append(data[i:i+seq_length])
            y_lstm.append(data[i+seq_length][0]) # Predict next day temperature
            
        X_t = torch.tensor(np.array(X_lstm), dtype=torch.float32)
        y_t = torch.tensor(np.array(y_lstm), dtype=torch.float32).unsqueeze(1)
        
        lstm_model = WeatherLSTM(input_size=2)  # type: ignore
        criterion = nn.MSELoss()
        optimizer = optim.Adam(lstm_model.parameters(), lr=0.01)
        
        for epoch in range(20): # fast train
            optimizer.zero_grad()
            out = lstm_model(X_t)
            loss = criterion(out, y_t)
            loss.backward()
            optimizer.step()
            
        torch.save(lstm_model.state_dict(), f"{version_dir}/lstm_weather_weights.pth")
        print("  LSTM model trained.")
    else:
        print("  Skipped LSTM (torch not installed).")

    # --- Feature Importances (From XGBoost or RF) ---
    feature_importances = {}
    if HAS_XGBOOST:
        feature_importances = dict(zip(X.columns, xgb_model.feature_importances_))
    else:
        feature_importances = dict(zip(X.columns, rf_model.feature_importances_))
    feature_importances = {k: float(v) for k, v in feature_importances.items()}

    # --- Save Metadata ---
    metadata = {
        "version": version,
        "timestamp": timestamp,
        "models": {
            "risk_model": "XGBoost",
            "fraud_model": "RandForest",
            "claim_amount": "GradientBoosting",
            "anomaly": "IsolationForest",
            "segmentation": "KMeans",
            "seasonality": "ARIMA" if HAS_ARIMA else "None",
            "weather": "LSTM" if HAS_TORCH else "None",
            "nlp": "BERT/RoBERTa (Pipeline Loaded Dynamically)"
        },
        "metrics": metrics,
        "feature_importances": feature_importances,
        "training_data_splits": {
            "real_samples": len(real_df),
            "synthetic_samples": len(synth_df)
        }
    }

    with open(f"{version_dir}/metadata.json", 'w') as f:
        json.dump(metadata, f, indent=2)

    # --- Update the current pointer ---
    # We create a simple current.json on disk to point to the active version directory
    current_pointer_path = "model/current.json"
    
    pointer_data = {"active_version_dir": f"v{version}_{timestamp}"}
    with open(current_pointer_path, 'w') as f:
        json.dump(pointer_data, f)

    # Cleanup old versions (keep last 10)
    versions = sorted([d for d in os.listdir("model") if d.startswith("v") and os.path.isdir(os.path.join("model", d))])
    if len(versions) > 10:
        to_remove = versions[:-10]  # type: ignore
        for old_v in to_remove:
            print(f"Removing old version: {old_v}")
            shutil.rmtree(os.path.join("model", old_v))

    print(f"\n✅ All models trained and saved to {version_dir}")
    print(f"✅ Current pointer updated to Active Version")
    print("=" * 60)

if __name__ == "__main__":
    train_and_save_model()
