import torch
from torch_geometric.nn import GCNConv

class GNNModel(torch.nn.Module):
    def __init__(self, num_node_features, hidden_channels=128, num_classes=1):
        super(GNNModel, self).__init__()
        torch.manual_seed(42)
        
        # Increased capacity for node embeddings
        self.conv1 = GCNConv(num_node_features, hidden_channels)
        self.conv2 = GCNConv(hidden_channels, hidden_channels)
        
        # Deeper Edge classifier head: multi-layer MLP for higher non-linearity
        self.edge_mlp = torch.nn.Sequential(
            torch.nn.Linear(2 * hidden_channels, hidden_channels),
            torch.nn.ReLU(),
            torch.nn.Dropout(p=0.2),
            torch.nn.Linear(hidden_channels, hidden_channels // 2),
            torch.nn.ReLU(),
            torch.nn.Linear(hidden_channels // 2, num_classes)
        )

    def forward(self, x, edge_index):
        # 1. Obtain node embeddings 
        x = self.conv1(x, edge_index)
        x = x.relu()
        x = self.conv2(x, edge_index)
        x = x.relu()

        # 2. Edge-level representation (concatenation)
        edge_feat = torch.cat([x[edge_index[0]], x[edge_index[1]]], dim=-1)

        # 3. Final classifier through MLP
        out = self.edge_mlp(edge_feat)
        
        return out # Logits for BCEWithLogitsLoss
