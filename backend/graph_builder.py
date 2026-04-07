import pandas as pd
import torch
import numpy as np
from torch_geometric.data import Data
from sklearn.preprocessing import LabelEncoder, StandardScaler

class GraphBuilder:
    def __init__(self):
        self.label_encoders = {}
        self.scaler = StandardScaler()
        
    def preprocess_data(self, df):
        # Fill missing values
        df = df.copy()
        df = df.fillna('Unknown')
        
        # Categorical columns to encode
        categorical_cols = [
            'transaction type', 'merchant_category', 'transaction_status',
            'sender_age_group', 'receiver_age_group', 'sender_state',
            'sender_bank', 'receiver_bank', 'device_type', 'network_type',
            'day_of_week'
        ]
        
        for col in categorical_cols:
            if col in df.columns:
                le = LabelEncoder()
                df[col] = le.fit_transform(df[col].astype(str))
                self.label_encoders[col] = le
        
        # Numerical columns to scale
        numerical_cols = ['amount (INR)', 'hour_of_day']
        df[numerical_cols] = self.scaler.fit_transform(df[numerical_cols])
        
        return df

    def build_graph(self, df):
        # Create mapping for nodes (sender and receiver)
        # In this dataset, we'll treat 'transaction id' as unique edges
        # and we need to identify 'sender' and 'receiver' nodes.
        # Since the dataset doesn't have explicit user/merchant IDs, 
        # let's assume sender_bank + sender_state and receiver_bank + receiver_age_group as proxies if needed,
        # but the prompt mentions: payer_id, payee_id in typical columns.
        # Let's check the actually available columns in upi_transactions_2024.csv again.
        
        # Columns: ['transaction id', 'timestamp', 'transaction type', 'merchant_category', 
        #           'amount (INR)', 'transaction_status', 'sender_age_group', 'receiver_age_group', 
        #           'sender_state', 'sender_bank', 'receiver_bank', 'device_type', 'network_type', 
        #           'fraud_flag', 'hour_of_day', 'day_of_week', 'is_weekend']
        
        # We'll create unique IDs for senders and receivers based on bank + state + age_group
        df['sender_node_id'] = df['sender_bank'].astype(str) + "_" + df['sender_state'].astype(str) + "_" + df['sender_age_group'].astype(str)
        df['receiver_node_id'] = df['receiver_bank'].astype(str) + "_" + df['receiver_age_group'].astype(str)
        
        nodes = pd.unique(pd.concat([df['sender_node_id'], df['receiver_node_id']]))
        node_map = {node: i for i, node in enumerate(nodes)}
        
        # Edge index
        edge_s = df['sender_node_id'].map(node_map).values
        edge_r = df['receiver_node_id'].map(node_map).values
        edge_index = torch.tensor([edge_s, edge_r], dtype=torch.long)
        
        # Node features (aggregated per node)
        # For simplicity, we'll use mean of transaction features as node features
        node_features = []
        feature_cols = [
            'transaction type', 'merchant_category', 'amount (INR)', 
            'hour_of_day', 'is_weekend'
        ]
        
        # Group by sender/receiver and aggregate
        sender_feats = df.groupby('sender_node_id')[feature_cols].mean()
        receiver_feats = df.groupby('receiver_node_id')[feature_cols].mean()
        
        for node in nodes:
            # Combine features if node is both sender and receiver
            feats = []
            if node in sender_feats.index and node in receiver_feats.index:
                feats = (sender_feats.loc[node] + receiver_feats.loc[node]) / 2
            elif node in sender_feats.index:
                feats = sender_feats.loc[node]
            else:
                feats = receiver_feats.loc[node]
            node_features.append(feats.values)
            
        x = torch.tensor(np.array(node_features), dtype=torch.float)
        
        # Labels
        y = torch.tensor(df['fraud_flag'].values, dtype=torch.float).view(-1, 1)
        
        # In GNN settings like this, we often predict edge labels or graph labels.
        # Here, the fraud flag is per transaction (edge).
        # PyG can handle edge-level prediction.
        
        return Data(x=x, edge_index=edge_index, y=y)

    def get_user_stats(self, user_df):
        # Calculate stats for anomaly detection
        stats = user_df.groupby('user_id')['amount'].agg(['mean', 'std', 'count']).to_dict(orient='index')
        return stats
