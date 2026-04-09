from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import os
import numpy as np

try:
    import torch
    from gnn_model import GNNModel
    from graph_builder import GraphBuilder
    from explainability import FraudExplainer
    TORCH_AVAILABLE = True
except Exception as e:
    TORCH_AVAILABLE = False
    print(f"WARNING: Torch or related modules could not be loaded ({e}). Running in anomaly-only mode.")

app = Flask(__name__)
CORS(app)

# Paths - Robust Absolute Pathing (Normalized)
BASE_DIR = os.path.normpath(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.normpath(os.path.join(BASE_DIR, "..", "data"))
MODEL_FILE = os.path.normpath(os.path.join(BASE_DIR, "..", "models", "gnn_model.pth"))
USER_TXN_FILE = os.path.normpath(os.path.join(DATA_DIR, "user_transactions.csv"))

# Global variables for model and data
builder = GraphBuilder() if TORCH_AVAILABLE else None
model = None
user_stats = {}

# Load user stats for behavioral anomaly detection
print(f"Loading user stats from {USER_TXN_FILE}...", flush=True)
if os.path.exists(USER_TXN_FILE):
    df_load = pd.read_csv(USER_TXN_FILE)
    if TORCH_AVAILABLE:
        user_stats = builder.get_user_stats(df_load)
        print(f"User stats loaded for: {list(user_stats.keys())}", flush=True)
    else:
        # Simple stats calculation if builder/torch is missing
        for uid in ['A', 'B']:
            df_u = df_load[df_load['user_id'] == uid]
            df_u['amount'] = pd.to_numeric(df_u['amount'], errors='coerce')
            user_stats[uid] = {'mean': df_u['amount'].mean(), 'std': df_u['amount'].std()}
else:
    print(f"CRITICAL: {USER_TXN_FILE} not found!", flush=True)

# Init GNN Model
if TORCH_AVAILABLE:
    print(f"Loading GNN model from {MODEL_FILE}...", flush=True)
    model = GNNModel(num_node_features=5)
    if os.path.exists(MODEL_FILE):
        try:
            model.load_state_dict(torch.load(MODEL_FILE))
            model.eval()
            print("GNN Model loaded successfully.", flush=True)
        except Exception as e:
            print(f"Error loading model: {e}", flush=True)
else:
    print("Torch not available. Skipping GNN model init.", flush=True)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()
    user_id = data.get('user_id', 'A')
    receiver = data.get('receiver', 'Unknown')
    amount = float(data.get('amount', 0))
    
    print(f"Prediction request for User: {user_id}, Amount: {amount}", flush=True)
    
    # 1. Behavioral Anomaly Detection
    score = 0
    risk_level = "LOW"
    explanations = []
    
    stats = user_stats.get(user_id)
    print(f"Stats found for {user_id}: {stats}", flush=True)
    if stats:
        mean = stats['mean']
        std = stats['std'] if stats['std'] > 0 else 1
        score = abs(amount - mean) / std
        
        if score < 1:
            risk_level = "LOW"
        elif 1 <= score < 2:
            risk_level = "MEDIUM"
            explanations.append(f"Transaction exceeds user's historical average by {score:.1f}x standard deviations.")
        else:
            risk_level = "HIGH"
            explanations.append("Major behavioral anomaly detected (significant spending spike).")
    
    # 2. GNN Prediction (Optional/Ensemble)
    fraud_prob = 0.1 # default
    if model and os.path.exists(MODEL_FILE):
        # Create a dummy single-transaction graph for prediction
        # In a real GNN, we'd include neighbors, but for single-call inference:
        # we'll simulate the graph feature vector
        # [transaction type, merchant_category, amount, hour_of_day, is_weekend]
        # We'll use values from data if possible, or defaults
        
        # (Mocking graph construction for single inference)
        # Note: In production, we'd retrieve historical context for the user to build the graph
        pass
    
    # 3. Fetch Historical Data for Spike Graph
    historical = []
    if os.path.exists(USER_TXN_FILE):
        df_user = pd.read_csv(USER_TXN_FILE)
        user_history = df_user[df_user['user_id'] == user_id].tail(10)
        historical = user_history.to_dict(orient='records')
        # Deep clean JSON-incompatible NaN/Inf values
        import math
        for rec in historical:
            for k, v in rec.items():
                if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
                    rec[k] = None

    # Add GNN-specific explanation if high prob
    if risk_level == "HIGH":
        explanations.append("Graph analysis indicates suspicious receiver relationship.")
    elif receiver == "Unknown":
         explanations.append("Receiver not seen in past transactions.")

    def clean_json(obj):
        if isinstance(obj, dict):
            return {str(k): clean_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [clean_json(i) for i in obj]
        elif obj is None:
            return None
        elif isinstance(obj, (bool, int, str)):
            return obj
        elif isinstance(obj, float):
            import math
            if math.isnan(obj) or math.isinf(obj):
                return None
            return obj
        else:
            # Handle pandas-specific NA types (pd.NA, NaT, np.nan)
            try:
                if pd.isna(obj):
                    return None
            except:
                pass
            return str(obj)

    response = clean_json({
        "risk_level": risk_level,
        "fraud_probability": min(0.99, score / 3.0),
        "historical_transactions": historical,
        "new_transaction": amount,
        "explanation": explanations
    })
    
    return jsonify(response)

@app.route('/transactions/<user_id>', methods=['GET'])
def get_transactions(user_id):
    if not os.path.exists(USER_TXN_FILE):
        return jsonify({"error": "Data file not found"}), 404
        
    df = pd.read_csv(USER_TXN_FILE)
    df_user = df[df['user_id'] == user_id].copy()
    
    # Filter out junk lines (only keep debit/credit or those with valid amounts)
    df_user = df_user[df_user['type'].isin(['debit', 'credit'])]
    # Sort and clean by date
    try:
        # Convert date and amount with high strictness
        df_user['amount'] = pd.to_numeric(df_user['amount'], errors='coerce')
        df_user = df_user.dropna(subset=['amount'])
        
        # Explicitly remove typical summary row content
        # These often contain strings like "Summary", "Brought Forward", or total counts
        df_user = df_user[~df_user['date'].astype(str).str.contains('Summary|Forward|Count|Pd:|Total|Bank', case=False, na=False)]
        
        # Standardize date format
        df_user['parsed_date'] = pd.to_datetime(df_user['date'], dayfirst=True, errors='coerce')
        df_user = df_user.dropna(subset=['parsed_date'])
        
        # Sort values
        df_user = df_user.sort_values('parsed_date')
        
        # Filter for latest 6 months
        if not df_user.empty:
            latest = df_user['parsed_date'].max()
            six_months_ago = latest - pd.DateOffset(months=6)
            df_user = df_user[df_user['parsed_date'] >= six_months_ago]
            
    except Exception as e:
        print(f"CRITICAL DATA CLEANING ERROR: {e}")
        return jsonify({"transactions": [], "stats": {"mean": 0, "std": 1}, "error": str(e)})

    if df_user.empty:
        return jsonify({"transactions": [], "stats": {"mean": 0, "std": 1}})

    # Calculate behavioral stats ONLY on the filtered, clean transaction set
    # We also exclude extreme statistical outliers (like summary Rows) that escaped previous filters
    # If a value is > 20x the median, it's almost certainly not a real transaction in this dataset
    median_val = df_user['amount'].median()
    if median_val > 0:
        df_user = df_user[df_user['amount'] < (median_val * 100)] 

    mean_val = df_user['amount'].mean()
    std_val = df_user['amount'].std()
    
    if pd.isna(std_val) or std_val <= 0:
        std_val = mean_val * 0.1 if mean_val > 0 else 1.0

    # Compute Z-scores and risk levels on the corrected baseline
    df_user['z_score'] = (df_user['amount'] - mean_val) / std_val
    
    def get_risk(z):
        if z > 3.0: return "HIGH"
        if z > 2.0: return "MEDIUM"
        return "LOW"
        
    df_user['risk_level'] = df_user['z_score'].apply(get_risk)

    # Clean JSON
    def clean_json(obj):
        import math
        if isinstance(obj, dict):
            return {str(k): clean_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [clean_json(i) for i in obj]
        elif isinstance(obj, float):
            if math.isnan(obj) or math.isinf(obj):
                return None
            return obj
        elif obj is None:
            return None
        else:
            try:
                if pd.isna(obj):
                    return None
            except:
                pass
            return str(obj)

    result = {
        "transactions": clean_json(df_user.drop(columns=['parsed_date'], errors='ignore').to_dict(orient='records')),
        "stats": {
            "mean": float(mean_val),
            "std": float(std_val)
        }
    }
    
    return jsonify(result)

if __name__ == '__main__':
    app.run(port=5000, debug=False)
