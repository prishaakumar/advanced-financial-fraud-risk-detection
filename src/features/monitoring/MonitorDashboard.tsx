import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, AlertTriangle, CheckCircle, XCircle, TrendingUp, DollarSign, BarChart3, Play, Pause, Eye } from 'lucide-react';
import { useTransactions } from '@/context/TransactionContext';
import { SHAPChart } from '../payment/components/SHAPChart';
import SpikeDashboard from './components/SpikeDashboard';
import type { FraudResult } from '@/types';

const MonitorDashboard: React.FC = () => {
  const { results, stats } = useTransactions();
  const [selectedResult, setSelectedResult] = useState<FraudResult | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-7 w-7 text-primary" />
              Fraud Monitor
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time AI-powered transaction surveillance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-success/10 px-4 py-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-success">{stats.systemStatus}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8 md:grid-cols-4">
          <StatCard
            icon={<Activity className="h-5 w-5" />}
            label="Total Transactions"
            value={stats.totalTransactions.toString()}
            color="text-primary"
            bgColor="bg-primary/10"
          />
          <StatCard
            icon={<AlertTriangle className="h-5 w-5" />}
            label="Fraud Detected"
            value={stats.totalFraud.toString()}
            color="text-destructive"
            bgColor="bg-destructive/10"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Fraud Rate"
            value={`${stats.fraudRate.toFixed(1)}%`}
            color="text-warning"
            bgColor="bg-warning/10"
          />
          <StatCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Today's Spending"
            value={`₹${stats.todaySpending.toLocaleString()}`}
            color="text-success"
            bgColor="bg-success/10"
          />
        </div>

        {/* Spike Analytics Dashboard */}
        <SpikeDashboard />

        {/* Main content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Transaction Log */}
          <div className="lg:col-span-2">
            <div className="glass-card-elevated rounded-2xl overflow-hidden">
              <div className="border-b border-border px-5 py-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  Transaction Log
                </h2>
                <span className="text-xs text-muted-foreground">{results.length} records</span>
              </div>
              <div className="max-h-[520px] overflow-y-auto">
                <AnimatePresence initial={false}>
                  {results.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground text-sm">
                      Waiting for transactions...
                    </div>
                  ) : (
                    results.slice(0, 50).map((r, i) => (
                      <motion.div
                        key={r.transaction.id + i}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`border-b border-border/50 px-5 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors cursor-pointer ${
                          selectedResult?.transaction.id === r.transaction.id ? 'bg-accent/50' : ''
                        }`}
                        onClick={() => setSelectedResult(r)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            r.approved ? 'bg-success/10' : 'bg-destructive/10'
                          }`}>
                            {r.approved ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <XCircle className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{r.transaction.receiverName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {r.transaction.receiverUPI} · {r.transaction.type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3 flex items-center gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">₹{r.transaction.amount.toLocaleString()}</p>
                            <p className={`text-xs font-medium ${
                              r.riskLevel === 'LOW' ? 'text-success' : r.riskLevel === 'MEDIUM' ? 'text-warning' : 'text-destructive'
                            }`}>
                              {r.riskLevel} · {(r.probability * 100).toFixed(0)}%
                            </p>
                          </div>
                          <Eye className="h-3.5 w-3.5 text-muted-foreground/50" />
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Detail Panel */}
          <div>
            <AnimatePresence mode="wait">
              {selectedResult ? (
                <motion.div
                  key={selectedResult.transaction.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="glass-card-elevated rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Transaction Details</h3>
                    <div className="space-y-2 text-xs">
                      {[
                        ['ID', selectedResult.transaction.id],
                        ['Receiver', selectedResult.transaction.receiverName],
                        ['UPI', selectedResult.transaction.receiverUPI],
                        ['Amount', `₹${selectedResult.transaction.amount.toLocaleString()}`],
                        ['Type', selectedResult.transaction.type],
                        ['Balance', `₹${selectedResult.transaction.balance.toLocaleString()}`],
                        ['Time', selectedResult.transaction.timestamp.toLocaleTimeString()],
                        ['Status', selectedResult.approved ? 'APPROVED' : 'BLOCKED'],
                        ['Probability', `${(selectedResult.probability * 100).toFixed(1)}%`],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium text-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <SHAPChart features={selectedResult.featureImportance} />
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="glass-card rounded-2xl p-8 text-center"
                >
                  <Eye className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">Select a transaction to view details and SHAP analysis</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

function StatCard({ icon, label, value, color, bgColor }: {
  icon: React.ReactNode; label: string; value: string; color: string; bgColor: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-elevated rounded-2xl p-4"
    >
      <div className={`inline-flex rounded-xl p-2.5 mb-3 ${bgColor}`}>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}

export default MonitorDashboard;
