# SecurePay: AI-Protected Payments (Standalone)

SecurePay (formerly Guardian Pay) is a modern, real-time transaction monitoring and fraud detection platform. This version is a standalone frontend application that simulates a production-ready financial experience with built-in AI behavior logic.

## 🌟 Key Features

* **Real-Time Fraud Simulation:** Instant analysis of transactions using localized behavioral scoring logic.
* **Dual-Algorithm Simulation:** Emulates both behavioral heuristics and network risk patterns directly in the browser.
* **Personalized Scoring:** Simulates distinct user profiles (User A vs. User B) with unique statistical spending habits.
* **Explainable AI (SHAP) Visuals:** Provides visual breakdowns of why a transaction might be flagged as risky.
* **Modern UI/UX:** Built with React, Tailwind CSS, and Framer Motion for a premium, responsive experience.

## 🏗️ Project Structure

The project follows a scalable, feature-based organization:

```text
src/
├── api/                # Mocked AI Inference Engine
├── context/            # Global Transaction State
├── features/           # Feature-based logic
│   ├── monitoring/     # Fraud Monitor Dashboard
│   └── payment/        # Payment Portal & Risk Components
├── layouts/            # Common Layout Components (Navigation)
├── types/              # Centralized TypeScript Definitions
└── pages/              # Root-level Route Components
```

## 🚀 Getting Started

### Installation

1. Clone the repository.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the development server:
   ```sh
   npm run dev
   ```

The application will be available at `http://localhost:8080` (or the port specified by Vite).

## 🧪 Simulation Scenarios

Explore the AI logic by switching between users:

- **User A (High Spender):** Try sending ₹50,000 (Risky) vs ₹800 (Safe).
- **User B (Daily Spender):** Try sending ₹10,000 (Risky) vs ₹500 (Safe).

Observe how the **Risk Meter** and **SHAP Charts** react to different amounts and transaction types.
