import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { FraudResult, Transaction, TransactionType, DashboardStats } from '@/types';
import { detectFraud, generateTransactionId, completeTransaction } from '@/api/fraudEngine';

interface TransactionContextValue {
  results: FraudResult[];
  stats: DashboardStats;
  submitTransaction: (tx: Transaction) => Promise<FraudResult>;
  finalizeTransaction: (result: FraudResult) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextValue | null>(null);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [results, setResults] = useState<FraudResult[]>([]);

  const submitTransaction = useCallback(async (tx: Transaction): Promise<FraudResult> => {
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));
    const result = await detectFraud(tx);
    return result;
  }, []);

  const finalizeTransaction = useCallback(async (result: FraudResult) => {
    await completeTransaction(result);
    setResults(prev => [result, ...prev].slice(0, 200));
  }, []);

  const stats: DashboardStats = React.useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayResults = results.filter(r => r.transaction.timestamp >= today);
    const fraudCount = results.filter(r => r.isFraud).length;
    return {
      totalTransactions: results.length,
      totalFraud: fraudCount,
      fraudRate: results.length > 0 ? (fraudCount / results.length) * 100 : 0,
      todaySpending: todayResults.reduce((sum, r) => sum + (r.approved ? r.transaction.amount : 0), 0),
      systemStatus: 'AI Protection Active',
    };
  }, [results]);

  return (
    <TransactionContext.Provider value={{ results, stats, submitTransaction, finalizeTransaction }}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const ctx = useContext(TransactionContext);
  if (!ctx) throw new Error('useTransactions must be used within TransactionProvider');
  return ctx;
}
