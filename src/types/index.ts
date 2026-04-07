export type TransactionType = 'TRANSFER' | 'PAYMENT' | 'CASH_OUT' | 'DEBIT';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Transaction {
  id: string;
  receiverName: string;
  receiverUPI: string;
  amount: number;
  type: TransactionType;
  balance: number;
  timestamp: Date;
  sender?: string;
  isSimulated?: boolean;
}

export interface FraudResult {
  transaction: Transaction;
  isFraud: boolean;
  probability: number;
  riskLevel: RiskLevel;
  approved: boolean;
  requiresVerification?: boolean;
  featureImportance: FeatureImportance[];
  reasons: string[];
  historicalTransactions?: any[];
  newTransaction?: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  value: string;
  direction: 'increases' | 'decreases';
}

export interface DashboardStats {
  totalTransactions: number;
  totalFraud: number;
  fraudRate: number;
  todaySpending: number;
  systemStatus: string;
}
