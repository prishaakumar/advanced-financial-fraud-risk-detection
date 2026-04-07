import os
import torch
import pandas as pd
import numpy as np
from graph_builder import GraphBuilder
from gnn_model import GNNModel
from torch_geometric.loader import DataLoader
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

# Config
DATA_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data", "upi_transactions_2024.csv")
MODEL_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "models", "gnn_model.pth")

def evaluate():
    if not os.path.exists(MODEL_FILE):
        print(f"Error: Model file {MODEL_FILE} not found.")
        return

    print("Loading data...")
    df = pd.read_csv(DATA_PATH)
    
    builder = GraphBuilder()
    df_preprocessed = builder.preprocess_data(df)
    
    subgraph_size = 1000
    dataset = []
    print("Building graphs...")
    for i in range(0, len(df_preprocessed), subgraph_size):
        chunk = df_preprocessed.iloc[i : i + subgraph_size]
        if len(chunk) < 100: continue
        data = builder.build_graph(chunk)
        dataset.append(data)
    
    # Use the same split logic as training (with same random state for consistency)
    _, test_data = train_test_split(dataset, test_size=0.15, random_state=42)
    test_loader = DataLoader(test_data, batch_size=1, shuffle=False)

    num_features = dataset[0].num_node_features
    model = GNNModel(num_node_features=num_features)
    model.load_state_dict(torch.load(MODEL_FILE))
    model.eval()

    y_true = []
    y_pred = []

    print("Starting evaluation...")
    with torch.no_grad():
        for data in test_loader:
            # logits for each edge
            logits = model(data.x, data.edge_index)
            # Probability > 0.5 corresponds to logit > 0
            predictions = (logits > 0).float()
            
            y_true.extend(data.y.view(-1).cpu().numpy())
            y_pred.extend(predictions.view(-1).cpu().numpy())

    accuracy = accuracy_score(y_true, y_pred)
    precision = precision_score(y_true, y_pred, zero_division=0)
    recall = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)

    print("\n" + "="*30)
    print("GNN MODEL PERFORMANCE METRICS")
    print("="*30)
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print("="*30)

if __name__ == "__main__":
    evaluate()
