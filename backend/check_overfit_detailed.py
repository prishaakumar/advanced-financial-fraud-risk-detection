import torch
import pandas as pd
import os
import sys
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, recall_score, precision_score

# Ensure backend directory is in path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from gnn_model import GNNModel
from graph_builder import GraphBuilder
from torch_geometric.loader import DataLoader

def check_overfit():
    base_dir = os.path.dirname(backend_dir)
    DATA_PATH = os.path.join(base_dir, "data", "upi_transactions_2024.csv")
    MODEL_PATH = os.path.join(base_dir, "models", "gnn_model.pth")
    
    if not os.path.exists(MODEL_PATH):
        print("Model not found at", MODEL_PATH)
        return

    print("Loading model and data for overfit analysis...")
    model = GNNModel(num_node_features=5)
    model.load_state_dict(torch.load(MODEL_PATH))
    model.eval()
    
    df = pd.read_csv(DATA_PATH)
    builder = GraphBuilder()
    df_pre = builder.preprocess_data(df)
    
    subgraph_size = 1000
    dataset = []
    for i in range(0, min(len(df_pre), 50000), subgraph_size):
        chunk = df_pre.iloc[i : i + subgraph_size]
        if len(chunk) < 100: continue
        data = builder.build_graph(chunk)
        dataset.append(data)
    
    train_data, test_data = train_test_split(dataset, test_size=0.15, random_state=42)
    
    def get_metrics(data_list, desc):
        loader = DataLoader(data_list, batch_size=1)
        y_true = []
        y_pred = []
        with torch.no_grad():
            for d in loader:
                out = model(d.x, d.edge_index)
                pred = (out > 0).float()
                y_true.extend(d.y.view(-1).numpy())
                y_pred.extend(pred.view(-1).numpy())
        
        acc = accuracy_score(y_true, y_pred)
        rec = recall_score(y_true, y_pred, zero_division=0)
        prec = precision_score(y_true, y_pred, zero_division=0)
        print(f"[{desc}] Accuracy: {acc:.4f}, Recall: {rec:.4f}, Precision: {prec:.4f}")
        return acc

    train_acc = get_metrics(train_data, "TRAIN")
    test_acc = get_metrics(test_data, "TEST")
    
    gap = train_acc - test_acc
    print(f"\nAccuracy Gap (Train - Test): {gap:.4f}")
    if gap > 0.05:
        print("WARNING: Significant overfitting detected!")
    else:
        print("Model seems to generalize reasonably well.")

if __name__ == "__main__":
    check_overfit()
