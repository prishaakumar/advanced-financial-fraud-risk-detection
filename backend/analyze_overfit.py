import torch
import pandas as pd
import os
import sys

# Ensure backend directory is in the path for local imports
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from gnn_model import GNNModel
from graph_builder import GraphBuilder
from torch_geometric.loader import DataLoader
from sklearn.model_selection import train_test_split
from sklearn.metrics import confusion_matrix, accuracy_score, precision_score, recall_score

def analyze():
    # Use relative paths based on the backend directory
    base_dir = os.path.dirname(backend_dir)
    DATA_PATH = os.path.join(base_dir, "data", "upi_transactions_2024.csv")
    MODEL_PATH = os.path.join(base_dir, "models", "gnn_model.pth")
    
    model = GNNModel(num_node_features=5)
    model.load_state_dict(torch.load(MODEL_PATH))
    model.eval()
    
    df = pd.read_csv(DATA_PATH)
    builder = GraphBuilder()
    df_pre = builder.preprocess_data(df)
    
    subgraph_size = 1000
    dataset = []
    for i in range(0, len(df_pre), subgraph_size):
        chunk = df_pre.iloc[i : i + subgraph_size]
        if len(chunk) < 100: continue
        data = builder.build_graph(chunk)
        dataset.append(data)
    
    _, test_data = train_test_split(dataset, test_size=0.15, random_state=42)
    loader = DataLoader(test_data, batch_size=1)
    
    y_true = []
    y_pred = []
    
    with torch.no_grad():
        for d in loader:
            out = model(d.x, d.edge_index)
            pred = (out > 0).float()
            y_true.extend(d.y.view(-1).numpy())
            y_pred.extend(pred.view(-1).numpy())
            
    cm = confusion_matrix(y_true, y_pred)
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print("Confusion Matrix:")
    print(cm)
    print(f"Predicted 1s: {sum(y_pred)}")
    print(f"Actual 1s:    {sum(y_true)}")

if __name__ == '__main__':
    analyze()
