import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Shield, CheckCircle, AlertTriangle, XCircle, Loader2, KeyRound } from 'lucide-react';
import { useTransactions } from '@/context/TransactionContext';
import { computeLiveRiskScore, generateTransactionId } from '@/api/fraudEngine';
import type { TransactionType, FraudResult } from '@/types';
import { RiskMeter } from './components/RiskMeter';
import { SHAPChart } from './components/SHAPChart';
import { SpikeGraph } from './components/SpikeGraph';

const TX_TYPES: TransactionType[] = ['TRANSFER', 'PAYMENT', 'CASH_OUT', 'DEBIT'];

const USERS = [
  { id: 'user_A', label: 'User A', emoji: '👤', desc: 'Typical spend ₹0–₹22,704 (Avg ₹14,262)' },
  { id: 'user_B', label: 'User B', emoji: '👥', desc: 'Typical spend ₹0–₹1,420 (Avg ₹1,559)' },
];

const PaymentApp: React.FC = () => {
  const { submitTransaction, finalizeTransaction } = useTransactions();
  const [selectedUser, setSelectedUser] = useState<string>('user_A');
  const [receiverName, setReceiverName] = useState('');
  const [receiverUPI, setReceiverUPI] = useState('');
  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState<TransactionType>('PAYMENT');
  const [balance, setBalance] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<FraudResult | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [pendingResult, setPendingResult] = useState<FraudResult | null>(null);
  const [otp, setOtp] = useState('');

  // Fetch user balance (Simulated)
  React.useEffect(() => {
    const fetchUserBalance = async () => {
      setIsLoadingBalance(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockBalance = selectedUser === 'user_A' ? 142620 : 15590;
      setBalance(mockBalance.toString());
      console.log(`Loaded simulated balance for ${selectedUser}: ₹${mockBalance.toLocaleString()}`);
      setIsLoadingBalance(false);
    };

    fetchUserBalance();
  }, [selectedUser]);

  const liveRisk = useMemo(() => {
    const amt = parseFloat(amount) || 0;
    if (amt === 0) return { score: 0, reasons: [] };
    const bal = parseFloat(balance) || 1;
    // Pass selectedUser to ensure personalized risk calculation
    return computeLiveRiskScore(amt, bal, txType, selectedUser);
  }, [amount, balance, txType, selectedUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverName || !receiverUPI || !amount) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const fraudResult = await submitTransaction({
        id: generateTransactionId(),
        receiverName,
        receiverUPI,
        amount: parseFloat(amount),
        type: txType,
        balance: parseFloat(balance),
        timestamp: new Date(),
        sender: selectedUser,
      });

      if (fraudResult.requiresVerification) {
        setPendingResult(fraudResult);
        setShowOTP(true);
      } else {
        // Low (Approved) or High (Blocked)
        await finalizeTransaction(fraudResult);
        setResult(fraudResult);
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      alert('Transaction failed. Please check console for details.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === '123456' && pendingResult) {
      const verifiedResult = { ...pendingResult, approved: true };
      await finalizeTransaction(verifiedResult);
      setResult(verifiedResult);
      setShowOTP(false);
      setOtp('');
    } else {
      alert('Invalid OTP. Please enter 123456 for demo.');
    }
  };

  const resetForm = () => {
    setReceiverName('');
    setReceiverUPI('');
    setAmount('');
    setTxType('PAYMENT');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-hero">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">SecurePay</h1>
          <p className="text-sm text-muted-foreground">AI-Protected Payments</p>
        </motion.div>

        {/* Risk Meter */}
        <RiskMeter
          score={result ? result.probability : liveRisk.score}
          reasons={result ? result.reasons : liveRisk.reasons}
        />

        {/* Payment Form */}
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card-elevated rounded-2xl p-8 text-center"
            >
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium text-foreground">Processing payment...</p>
              <p className="mt-1 text-sm text-muted-foreground">Running AI fraud analysis</p>
              <div className="mt-4 flex justify-center gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="h-2 w-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                  />
                ))}
              </div>
            </motion.div>
          ) : showOTP ? (
            <motion.div
              key="otp"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card-elevated rounded-2xl p-8"
            >
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-warning/20">
                  <KeyRound className="h-7 w-7 text-warning" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Verification Required</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  A Medium Risk alert was triggered. Please enter the OTP sent to your registered mobile.
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <div className="flex justify-center gap-3">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-12 w-10 rounded-lg border-2 border-input bg-background flex items-center justify-center text-lg font-bold">
                        {otp[i] || '•'}
                      </div>
                    ))}
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                    className="absolute inset-0 opacity-0 cursor-default"
                  />
                  <p className="mt-4 text-center text-xs text-muted-foreground uppercase tracking-wider">Demo: Enter 123456</p>
                </div>

                <button
                  type="submit"
                  disabled={otp.length !== 6}
                  className="w-full rounded-xl gradient-hero py-3.5 text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Verify & Pay
                </button>
                <button
                  type="button"
                  onClick={() => setShowOTP(false)}
                  className="w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </form>
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <ResultCard result={result} onReset={resetForm} />
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="glass-card-elevated rounded-2xl p-6 space-y-4"
            >
              {/* User Selector */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Account / Sender</label>
                <div className="grid grid-cols-2 gap-2">
                  {USERS.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => setSelectedUser(u.id)}
                      className={`rounded-xl px-3 py-2.5 text-left transition-all border ${selectedUser === u.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-md'
                        : 'bg-secondary text-secondary-foreground border-transparent hover:bg-accent'
                        }`}
                    >
                      <div className="text-base">{u.emoji} <span className="font-semibold text-sm">{u.label}</span></div>
                      <div className={`text-xs mt-0.5 ${selectedUser === u.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{u.desc}</div>
                      {isLoadingBalance && selectedUser === u.id && (
                        <div className="mt-1 flex items-center gap-1 text-xs">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span>Loading...</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Receiver Name</label>
                <input
                  type="text"
                  value={receiverName}
                  onChange={e => setReceiverName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Receiver UPI ID</label>
                <input
                  type="text"
                  value={receiverUPI}
                  onChange={e => setReceiverUPI(e.target.value)}
                  required
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                    min="1"
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Balance (₹)
                    {isLoadingBalance && <span className="ml-2 text-xs text-muted-foreground">(Auto-loading...)</span>}
                  </label>
                  <input
                    type="number"
                    value={balance}
                    onChange={e => setBalance(e.target.value)}
                    required
                    readOnly={!isLoadingBalance}
                    className={`w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${isLoadingBalance ? 'bg-secondary/50 cursor-not-allowed' : ''
                      }`}
                  />
                  {!isLoadingBalance && balance && (
                    <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Auto-loaded from database
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">Transaction Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {TX_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTxType(t)}
                      className={`rounded-xl px-2 py-2.5 text-xs font-medium transition-all ${txType === t
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-secondary text-secondary-foreground hover:bg-accent'
                        }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl gradient-hero py-3.5 text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"
              >
                <Send className="h-4 w-4" />
                Pay Now
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

function ResultCard({ result, onReset }: { result: FraudResult; onReset: () => void }) {
  const isApproved = result.approved;
  const Icon = isApproved ? CheckCircle : result.riskLevel === 'MEDIUM' ? AlertTriangle : XCircle;

  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl p-6 text-center ${isApproved ? 'glass-card-elevated glow-green' : 'glass-card-elevated glow-red'
          }`}
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 10 }}>
          <Icon
            className={`mx-auto mb-3 h-14 w-14 ${isApproved ? 'text-success' : 'text-destructive'}`}
          />
        </motion.div>
        <h2 className={`text-xl font-bold ${isApproved ? 'text-success' : 'text-destructive'}`}>
          {isApproved ? 'Payment Approved' : 'Transaction Blocked'}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isApproved ? 'Transaction completed successfully' : `Fraud probability: ${(result.probability * 100).toFixed(1)}%`}
        </p>
        <div className="mt-4 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Transaction ID</span>
            <span className="font-mono font-medium text-foreground">{result.transaction.id}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Amount</span>
            <span className="font-medium text-foreground">₹{result.transaction.amount.toLocaleString()}</span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>Risk Level</span>
            <span className={`font-medium ${result.riskLevel === 'LOW' ? 'text-success' : result.riskLevel === 'MEDIUM' ? 'text-warning' : 'text-destructive'
              }`}>{result.riskLevel}</span>
          </div>
        </div>

        {!isApproved && (
          <div className="mt-3 rounded-xl bg-destructive/10 p-3 text-left">
            <p className="text-xs font-medium text-destructive mb-1">Reasons for blocking:</p>
            {result.reasons.map((r, i) => (
              <p key={i} className="text-xs text-destructive/80">• {r}</p>
            ))}
          </div>
        )}
      </div>

      {result.historicalTransactions && result.newTransaction && (
        <SpikeGraph 
          historicalData={result.historicalTransactions} 
          newTransaction={result.newTransaction} 
        />
      )}

      {!isApproved && <SHAPChart features={result.featureImportance} />}

      <button
        onClick={onReset}
        className="w-full rounded-xl border border-border bg-card py-3 font-medium text-foreground hover:bg-accent transition-colors"
      >
        New Transaction
      </button>
    </div>
  );
}

export default PaymentApp;
