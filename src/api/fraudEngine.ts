import type { Transaction, FraudResult, FeatureImportance, RiskLevel } from '../types';

// User profile structure matching backend Python implementation
interface UserProfile {
  mean: number;           // Average transaction amount
  std: number;            // Standard deviation
  p25: number;            // 25th percentile
  p75: number;            // 75th percentile
  p95: number;            // 95th percentile
  p99: number;            // 99th percentile
  typicalLower: number;   // Q1 - 1.5*IQR
  typicalUpper: number;   // Q3 + 1.5*IQR
  iqr: number;            // Interquartile range
}

// Personalized user profiles loaded from backend (matching Python USER_PROFILES)
const userProfiles: Record<string, UserProfile> = {
  'user_A': {
    mean: 14262,
    std: 29047,
    p25: 500,
    p75: 18000,
    p95: 45000,
    p99: 80000,
    typicalLower: 0,
    typicalUpper: 45000,
    iqr: 17500
  },
  'user_B': {
    mean: 1559,
    std: 6380,
    p25: 200,
    p75: 1200,
    p95: 3500,
    p99: 8000,
    typicalLower: 0,
    typicalUpper: 2500,
    iqr: 1000
  }
};

let transactionHistory: Transaction[] = [];

function generateTransactionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'TXN';
  for (let i = 0; i < 10; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export async function detectFraud(tx: Transaction): Promise<FraudResult> {
  if (!tx.id) tx.id = generateTransactionId();

  let apiResult: any = null;
  try {
    const response = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: tx.sender === 'user_A' ? 'A' : tx.sender === 'user_B' ? 'B' : 'A',
        receiver: tx.receiverName,
        amount: tx.amount,
      }),
    });

    if (response.ok) {
      const text = await response.text();
      try {
        apiResult = JSON.parse(text);
        console.log('Backend detection success:', apiResult);
      } catch (e) {
        console.error('Failed to parse backend JSON:', e, 'Raw text:', text);
      }
    }
  } catch (error) {
    console.warn('Backend connection failed, falling back to local engine:', error);
  }

  // Use API result if available, otherwise compute locally
  const score = apiResult ? apiResult.fraud_probability : computeLiveRiskScore(
    tx.amount, 
    tx.balance, 
    tx.type, 
    tx.sender ?? 'user_A'
  ).score;

  const reasons = apiResult ? apiResult.explanation : computeLiveRiskScore(
    tx.amount, 
    tx.balance, 
    tx.type, 
    tx.sender ?? 'user_A'
  ).reasons;

  const riskLevel = apiResult ? apiResult.risk_level : (score > 0.7 ? 'HIGH' : score > 0.35 ? 'MEDIUM' : 'LOW');

  const isFraud = riskLevel === 'HIGH';
  const approved = riskLevel === 'LOW';
  const requiresVerification = riskLevel === 'MEDIUM';

  // Deduplicate features: group reasons by feature and take max importance
  const featureMap = new Map<string, FeatureImportance>();
  
  reasons.forEach((reason: string) => {
    let feature = 'amount';
    let value = tx.amount.toString();
    if (reason.toLowerCase().includes('balance')) {
      feature = 'balance';
      value = tx.balance.toString();
    } else if (reason.toLowerCase().includes('type')) {
      feature = 'type';
      value = tx.type;
    } else if (reason.toLowerCase().includes('receiver')) {
      feature = 'receiver';
      value = tx.receiverName;
    } else if (reason.toLowerCase().includes('graph') || reason.toLowerCase().includes('relationship')) {
      feature = 'relationship';
      value = 'GNN Flag';
    }

    const importance = 0.2 + Math.random() * 0.3;
    if (!featureMap.has(feature) || importance > featureMap.get(feature)!.importance) {
      featureMap.set(feature, {
        feature,
        importance,
        value,
        direction: 'increases'
      });
    }
  });

  const featureImportance = Array.from(featureMap.values());

  const result: FraudResult = {
    transaction: tx,
    isFraud,
    probability: score,
    riskLevel: riskLevel as RiskLevel,
    approved,
    requiresVerification,
    featureImportance,
    reasons: reasons.length > 0 ? reasons : ['Transaction matches normal patterns'],
    // Include extra fields if available from API (optional integration)
    ...(apiResult && { 
       historicalTransactions: apiResult.historical_transactions,
       newTransaction: apiResult.new_transaction
    })
  } as any;

  transactionHistory.push(tx);
  if (transactionHistory.length > 100) transactionHistory = transactionHistory.slice(-100);

  return result;
}

/**
 * Mock persist a finalized transaction
 */
export async function completeTransaction(result: FraudResult): Promise<any> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    status: 'success',
    message: 'Transaction recorded successfully (Simulated)',
    id: result.transaction.id
  };
}

/**
 * Compute live risk score using the SAME algorithm as backend Python code
 * This ensures frontend and backend show consistent results
 * 
 * Multi-factor scoring:
 * 1. Z-Score Analysis (40% weight)
 * 2. IQR-Based Range Detection (35% weight)
 * 3. Percentile Thresholds (25% weight)
 */
export function computeLiveRiskScore(
  amount: number,
  balance: number,
  type: string,
  sender: string = 'user_A'
): { score: number; reasons: string[] } {
  // Get user-specific profile
  const profile = userProfiles[sender];

  if (!profile) {
    // Fallback to generic heuristics if user profile not found
    return { score: computeGenericRiskScore(amount, balance, type), reasons: ['New account history'] };
  }

  const reasons: string[] = [];

  const mean = profile.mean;
  const std = profile.std > 0 ? profile.std : Math.max(mean * 0.5, 100);
  const typicalLower = profile.typicalLower;
  const typicalUpper = profile.typicalUpper;
  const iqr = profile.iqr > 0 ? profile.iqr : 1000;
  const p95 = profile.p95;
  const p99 = profile.p99;

  // === 1. Z-Score Analysis (40% weight) ===
  const zScore = (amount - mean) / std;
  const zScoreAbs = Math.abs(zScore);

  // Normalize z-score contribution (0-1 scale)
  // Using sigmoid-like function matching Python implementation
  let zContribution = 1 / (1 + Math.exp(-zScore + 1)) - 0.27;
  zContribution = Math.max(0, Math.min(1, zContribution));
  if (zContribution > 0.5) reasons.push('High value for this user');

  // === 2. IQR-Based Range Analysis (35% weight) ===
  const isBelowRange = amount < typicalLower;
  const isAboveRange = amount > typicalUpper;
  const isOutsideIQR = isBelowRange || isAboveRange;

  // Calculate how far outside the range (in IQR units)
  let iqrDeviation = 0;
  if (isBelowRange) {
    iqrDeviation = (typicalLower - amount) / iqr;
  } else if (isAboveRange) {
    iqrDeviation = (amount - typicalUpper) / iqr;
  }

  // IQR deviation contribution (0-1 scale)
  let iqrContribution = 1 - Math.exp(-0.7 * iqrDeviation);
  iqrContribution = Math.max(0, Math.min(1, iqrContribution));
  if (iqrContribution > 0.5) reasons.push('Outside normal spending range');

  // === 3. Percentile Analysis (25% weight) ===
  let percentileContribution = 0.0;
  if (amount > p99) {
    percentileContribution = 1.0;
  } else if (amount > p95) {
    percentileContribution = 0.7;
  } else if (isAboveRange) {
    percentileContribution = 0.3;
  }
  if (percentileContribution > 0.6) reasons.push('Extreme percentile amount');

  // === 4. Composite Score Calculation ===
  const zWeight = 0.40;
  const iqrWeight = 0.35;
  const percentileWeight = 0.25;

  const baseAnomalyScore = (
    zWeight * zContribution +
    iqrWeight * iqrContribution +
    percentileWeight * percentileContribution
  );

  // Apply non-linear amplification for high scores (matching Python)
  let anomalyScore = baseAnomalyScore;
  if (baseAnomalyScore > 0.7) {
    anomalyScore = Math.pow(baseAnomalyScore, 0.7);  // Amplify critical cases
  }

  // Ensure score stays between 0 and 1
  anomalyScore = Math.min(Math.max(anomalyScore, 0), 1);

  // --- Consistency Boost (Sticky Risk) ---
  // If behavioral anomalies suggest Medium risk (>= 0.35), 
  // ensure the final visual indicator reflects at least that.
  if (baseAnomalyScore >= 0.35) {
    anomalyScore = Math.max(anomalyScore, 0.40); // Force into Medium range (0.35+)
    reasons.push("Behavioral anomaly detected");
  }

  // Add business rule boost if amount exceeds balance
  if (balance > 0 && amount > balance) {
    const ratio = amount / balance;
    if (ratio >= 5) {
      anomalyScore = Math.max(anomalyScore, 0.95);
      reasons.push('Amount >> Balance (5x)');
    } else if (ratio >= 2) {
      anomalyScore = Math.max(anomalyScore, 0.80);
      reasons.push('Amount > Balance (2x)');
    } else if (ratio > 1) {
      anomalyScore = Math.max(anomalyScore, 0.65);
      reasons.push('Insufficient balance');
    }
  }

  if (type === 'CASH_OUT' && amount > 2000) {
    anomalyScore = Math.min(1.0, anomalyScore + 0.1);
    reasons.push('High risk transaction type');
  }

  return { score: anomalyScore, reasons: Array.from(new Set(reasons)) };
}

/**
 * Generic fallback for users without profiles
 */
function computeGenericRiskScore(amount: number, balance: number, type: string): number {
  let score = 0;

  if (type === 'CASH_OUT') score += 0.2;
  else if (type === 'TRANSFER') score += 0.1;

  const amountRatio = amount / 1000;  // Generic average
  if (amountRatio > 3) score += 0.3;
  else if (amountRatio > 2) score += 0.15;

  const balanceRatio = amount / Math.max(balance, 1);
  if (balanceRatio > 0.8) score += 0.3;
  else if (balanceRatio > 0.5) score += 0.15;

  return Math.min(Math.max(score, 0), 0.95);
}

export { generateTransactionId };

