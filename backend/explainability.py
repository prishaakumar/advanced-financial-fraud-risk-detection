import torch
from torch_geometric.explain import Explainer, GNNExplainer

class FraudExplainer:
    def __init__(self, model):
        self.model = model
        self.explainer = Explainer(
            model=model,
            algorithm=GNNExplainer(epochs=200),
            explanation_type='model',
            node_mask_type='attributes',
            edge_mask_type='object',
            model_config=dict(
                mode='regression',
                task_level='graph',
                return_type='probs',
            ),
        )

    def explain(self, x, edge_index, batch):
        explanation = self.explainer(x, edge_index, batch=batch)
        
        # Get important features
        node_feat_mask = explanation.node_mask
        edge_mask = explanation.edge_mask
        
        # In a real app, we would map these masks to feature names
        # Here we'll return generic top explanations based on the mask
        
        reasons = []
        if node_feat_mask is not None:
            # Aggregate importance across nodes
            feat_importance = node_feat_mask.mean(dim=0).abs()
            top_feats = torch.argsort(feat_importance, descending=True)[:3]
            
            # Map indices back to feature names (assuming fixed order from GraphBuilder)
            # Feature columns: ['transaction type', 'merchant_category', 'amount (INR)', 'hour_of_day', 'is_weekend']
            feat_names = ['Transaction Type', 'Merchant Category', 'Transaction Amount', 'Time of Day', 'Weekend']
            
            for f_idx in top_feats:
                reasons.append(f"{feat_names[f_idx]} contributed significantly to the risk score.")
        
        return reasons
