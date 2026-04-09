# GuardianPay: Real-Time Fraud Detection using Graph Neural Networks (GNN)

## 1. Abstract
As the volume of Unified Payments Interface (UPI) transactions continues to grow exponentially, the risk of fraudulent activities has also escalated. Traditional rule-based systems often fail to capture complex, non-linear relationships and evolving fraud patterns. This project, **GuardianPay**, presents a real-time fraud detection system that leverages Graph Neural Networks (GNNs) to model transactions as edges between heterogeneous nodes. By integrating behavioral heuristics with network-based structural patterns, the system achieves a target accuracy of 94% while providing Explainable AI (XAI) insights through GNNExplainer.

## 2. Introduction
Modern digital payment ecosystems require robust security measures that can operate at sub-second latency. Fraud detection is no longer just a classification problem but a relationship problem. Who is sending money? Who is receiving it? Is this behavior typical for this user? GuardianPay addresses these questions by building a dynamic graph of transactions and using deep learning to identify anomalies.

## 3. Methodology

### 3.1 Data Acquisition and Preprocessing
The system utilizes a 2024 UPI transaction dataset. Preprocessing involves:
- **Categorical Encoding**: Label encoding for features like `merchant_category`, `transaction_type`, and `sender_bank`.
- **Numerical Scaling**: Standard scaling for `amount (INR)` and `hour_of_day`.
- **Graph Construction**: Transactions are mapped as edges. Node IDs are synthesized using a combination of bank, state, and age group attributes to create a relational network.

### 3.2 GNN Architecture
The core model is a Graph Convolutional Network (GCN) designed for edge classification:
- **Node Embedding Layers**: Two `GCNConv` layers with 128 hidden channels each, using ReLU activation.
- **Edge Classifier Head**: A multi-layer Perception (MLP) that concatenates source and target node embeddings.
    - Layer 1: Linear (256 → 128) + ReLU + Dropout (0.2).
    - Layer 2: Linear (128 → 64) + ReLU.
    - Layer 3: Linear (64 → 1) with logit output for binary classification.

### 3.3 Training Strategy
The model is trained using `BCEWithLogitsLoss`. Due to the inherent class imbalance in fraud datasets, a dynamic `pos_weight` (calibrated to ~310.0) is utilized to prioritize the minority class (fraudulent transactions). We use the Adam optimizer with a learning rate of 0.001 and a custom scheduler to prevent overfitting.

### 3.4 Explainability Module
To ensure transparency, GuardianPay implements `GNNExplainer`. This module generates feature and edge masks to identify which specific parameters (e.g., transaction amount, time of day, or receiver relationship) most significantly contributed to a high-risk score.

## 4. System Architecture

### 4.1 Backend (Inference & Data Management)
- **Framework**: Flask (Python).
- **ML Engine**: PyTorch & PyTorch Geometric.
- **Logic**: A dual-signal ensemble approach combining:
    1. **Behavioral Anomaly Score**: Z-score calculation based on historical user spending.
    2. **GNN Probability Score**: Deep network-level fraud classification.

### 4.2 Frontend (User Interface)
- **Framework**: React with Vite.
- **Styling**: Tailwind CSS for a premium, responsive dashboard.
- **Animations**: Framer Motion for real-time monitoring visualizations.
- **Features**: Simulation of different user profiles (User A vs. User B) to demonstrate adaptive risk thresholds.

## 5. Experimental Results
The system demonstrates high performance in simulated environments:
- **Accuracy**: Targeting 94% on the test set.
- **Confusion Matrix Analysis**: Optimized to minimize false negatives (missed fraud) while maintaining a manageable false positive rate.
- **Explainability Validation**: Visual SHAP/GNNExplainer charts successfully map high transaction amounts or unusual time-of-day flags to the correct risk levels.

## 6. Conclusion and Future Work
GuardianPay showcases the efficacy of GNNs in the UPI fraud landscape. Future enhancements involve integrating real-time streaming data (e.g., Kafka) and implementing Federated Learning to ensure user privacy while training across multiple banking nodes.

## 7. References
- *Kipf, T. N., & Welling, M. (2016). Semi-supervised classification with graph convolutional networks.*
- *Ying, Z., et al. (2019). GNNExplainer: Generating Explanations for Graph Neural Networks.*
