# Advanced Model Financial Fraud Detection (GuardianPay)

![GuardianPay Dashboard](file:///C:/Users/Prisha/.gemini/antigravity/brain/76997403-fbc6-45ad-aec2-a44b360cbcfb/.system_generated/click_feedback/click_feedback_1775587863329.png)

## 📋 Abstract
As the volume of digital transactions (UPI) grows, traditional rule-based fraud detection systems struggle to keep up with complex, evolving patterns. **Advanced Model Financial Fraud Detection** is a real-time system that leverages **Graph Neural Networks (GNN)** and **Behavioral AI** to identify fraudulent activities with a target accuracy of 94%. By modeling transactions as a dynamic graph, the system captures non-linear relationships and network-level anomalies that traditional models miss.

## 🌟 Key Features
- **Real-Time GNN Inference**: Uses Graph Convolutional Networks (GCN) to analyze spatial transaction patterns.
- **Dual-Signal Ensemble**: Combines deep learning probability with statistical behavioral Z-scores (IQR analysis).
- **Explainable AI (XAI)**: Integrated SHAP-style charts and `GNNExplainer` to provide human-readable reasons for every risk flag.
- **Personalized Risk Thresholds**: Adaptive logic that learns individual user spending habits (e.g., User A vs User B).
- **Premium UI/UX**: Responsive dashboard built with React and Framer Motion for a modern financial experience.
- **Adaptive Security**:
    - **Safe**: Auto-approved transactions.
    - **Risky**: Triggers OTP (One-Time Password) verification.
    - **Fraudulent**: Instant blocking of suspicious attempts.

## 🏗️ Technical Architecture

### Backend (The Brain)
- **Engine**: Flask (Python)
- **Deep Learning**: PyTorch & PyTorch Geometric
- **Logic**: 
    - **Graph Construction**: Maps users and transactions into a relational network.
    - **Anomaly Detection**: Real-time statistical analysis of transaction spikes.

### Frontend (The Dashboard)
- **Framework**: React 18 with Vite
- **Styling**: Vanilla CSS with Tailwind tokens
- **Visuals**: Chart.js for SHAP explanations and custom SVG for Spike Graphs.

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or yarn

### 1. Backend Setup
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*The API will run at http://localhost:5000*

### 2. Frontend Setup
```bash
npm install
npm run dev
```
*The dashboard will be available at http://localhost:8080*

## 🧪 Simulation Scenarios
Explore the AI logic by switching between user profiles:
- **User A (High Spender)**: Average ₹14.2k. Try ₹50,000 (Risky) vs ₹500 (Safe).
- **User B (Daily Spender)**: Average ₹1.5k. Try ₹10,000 (Blocked) vs ₹200 (Safe).

## 📊 Visual Walkthrough
![Verification Recording](file:///C:/Users/Prisha/.gemini/antigravity/brain/76997403-fbc6-45ad-aec2-a44b360cbcfb/verify_guardian_pay_ui_1775587841887.webp)

## 🛠️ Project Structure
```text
├── backend/            # Flask API & GNN Implementation
│   ├── app.py          # Main API controller
│   ├── gnn_model.py    # GCN Architecture
│   └── graph_builder.py # Data -> Graph Logic
├── src/                # React Source Code
│   ├── api/            # Local/Remote Fraud Engine
│   ├── components/     # Reusable UI Blocks
│   └── features/       # Core Logic (Payment, Monitoring)
├── data/               # Transaction Datasets (CSV)
└── models/             # Trained GNN Models (.pth)
```

## 📜 Documentation
For theoretical details, refer to the `IEEE_Documentation.md` file located in the root directory.

---
Developed for **Final Year Project: Advanced Financial Fraud Detection**.
