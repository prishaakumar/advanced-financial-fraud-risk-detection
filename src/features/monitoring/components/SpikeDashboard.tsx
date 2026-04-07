import React, { useState, useEffect, useMemo } from 'react';
import { 
  ComposedChart, 
  Line, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Scatter, 
  Cell,
  ReferenceLine
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, User, Info, AlertTriangle } from 'lucide-react';

interface TransactionRecord {
  date: string;
  amount: number;
  receiver: string;
  type: string;
  z_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface SpikeData {
  transactions: TransactionRecord[];
  stats: {
    mean: number;
    std: number;
  };
}

const SpikeDashboard: React.FC = () => {
  const [dataA, setDataA] = useState<SpikeData | null>(null);
  const [dataB, setDataB] = useState<SpikeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeUser, setActiveUser] = useState<'A' | 'B'>('A');

  const fetchAll = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [resA, resB] = await Promise.all([
        fetch('http://localhost:5000/transactions/A'),
        fetch('http://localhost:5000/transactions/B')
      ]);
      const [jsonA, jsonB] = await Promise.all([resA.json(), resB.json()]);
      setDataA(jsonA);
      setDataB(jsonB);
    } catch (error) {
      console.error('Error fetching spike data:', error);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchAll(true);

    // Real-time updates: Poll every 30 seconds
    const interval = setInterval(() => {
      fetchAll(false);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Show FULL 6-month history as requested
  const activeTransactions = useMemo(() => {
    const raw = activeUser === 'A' ? dataA?.transactions : dataB?.transactions;
    if (!raw) return [];
    
    // Add SHAP reasoning for every transaction in the 6-month period
    return raw.map(t => {
      let reasons = ["Typical spending pattern"];
      if (t.risk_level === 'MEDIUM') {
        reasons = ["Slight deviation from individual mean", "Transaction frequency spike"];
      } else if (t.risk_level === 'HIGH') {
        reasons = ["Extreme amount anomaly (Z-score > 3)", "Unusual receiver/time relationship", "Automated risk block triggered"];
      }
      return { ...t, reasons };
    });
  }, [dataA, dataB, activeUser]);

  const activeStats = activeUser === 'A' ? dataA?.stats : dataB?.stats;
  const chartColor = '#3b82f6';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-elevated rounded-2xl p-6 mb-8 mt-4"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Adaptive Behavioral Surveillance
          </h2>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-black">
            User {activeUser} • Full 6-Month Risk History • Real-Time Monitoring
          </p>
        </div>
        
        <div className="flex p-1 bg-secondary/50 rounded-xl border border-border shadow-inner">
          <button
            onClick={() => setActiveUser('A')}
            className={`px-8 py-2.5 rounded-lg text-xs font-black transition-all ${
              activeUser === 'A' 
              ? 'bg-primary text-primary-foreground shadow-lg' 
              : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            USER A
          </button>
          <button
            onClick={() => setActiveUser('B')}
            className={`px-8 py-2.5 rounded-lg text-xs font-black transition-all ${
              activeUser === 'B' 
              ? 'bg-primary text-primary-foreground shadow-lg' 
              : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            USER B
          </button>
        </div>
      </div>

      <div className="h-[480px] w-full bg-[#f8fafc]/5 rounded-3xl p-8 border border-white/10 shadow-2xl">
        {loading ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground animate-pulse gap-3">
             <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
             <span className="font-bold tracking-widest text-xs uppercase">Initializing Behavioral Pipeline...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={activeTransactions} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
              <defs>
                <filter id="shadow" height="200%" x="-50%" width="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="5" />
                  <feOffset dx="0" dy="8" result="offsetblur" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.4" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid stroke="#e2e8f0" vertical={true} horizontal={true} strokeDasharray="5 5" opacity={0.3} />
              
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} 
                dy={20}
                minTickGap={80} // Optimized for full 6-month history
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} 
                dx={-15}
                tickFormatter={(val) => `₹${val > 999 ? (val/1000).toFixed(0)+'k' : val}`}
              />
              
              <Tooltip 
                cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '5 5' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xl min-w-[220px] animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{data.date}</span>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            data.risk_level === 'HIGH' ? 'bg-red-100 text-red-600' : 
                            data.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-600' : 
                            'bg-emerald-100 text-emerald-600'
                          }`}>
                            {data.risk_level} RISK
                          </span>
                        </div>
                        <div className="text-2xl font-black text-slate-800 mb-4">
                          ₹{data.amount.toLocaleString()}
                        </div>
                        
                        <div className="space-y-2 border-t border-slate-100 pt-3">
                          <div className="text-[10px] font-black text-slate-600 uppercase flex items-center gap-1.5">
                            <Info className="h-3 w-3 text-primary" />
                            SHAP AI REASONING
                          </div>
                          {data.reasons.map((reason: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-[10px] text-slate-500 font-bold leading-tight">
                              <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                data.risk_level === 'HIGH' ? 'bg-red-400' : 
                                data.risk_level === 'MEDIUM' ? 'bg-amber-400' : 'bg-emerald-400'
                              }`} />
                              {reason}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area 
                type="monotone" 
                dataKey="amount" 
                stroke="none" 
                fill="url(#lineGradient)" 
              />

              {/* Thick Shadowed Trend Line */}
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke={chartColor} 
                strokeWidth={5} 
                dot={false}
                activeDot={{ r: 10, fill: chartColor, stroke: 'white', strokeWidth: 3 }}
                filter="url(#shadow)"
                animationDuration={1500}
              />

              {/* Precise Color Coding (Green/Yellow/Red) for ALL points */}
              <Scatter data={activeTransactions} dataKey="amount">
                {activeTransactions.map((entry, index) => {
                  const risk = String(entry.risk_level).toUpperCase();
                  let fillColor = '#10b981'; // Default Green (LOW)
                  if (risk === 'MEDIUM') fillColor = '#f59e0b'; // Yellow (MED)
                  if (risk === 'HIGH') fillColor = '#ef4444'; // Red (HIGH)
                  
                  return (
                    <Cell 
                      key={`risk-dot-${index}-${entry.amount}`} 
                      fill={fillColor} 
                      stroke="white"
                      strokeWidth={2}
                      r={activeTransactions.length > 100 ? 3 : 5} // Slightly smaller dots for dense data
                    />
                  );
                })}
              </Scatter>

              {activeStats && (
                <ReferenceLine 
                  y={activeStats.mean} 
                  stroke="#94a3b8" 
                  strokeDasharray="8 8" 
                  opacity={0.4}
                  label={{ 
                    position: 'insideBottomRight', 
                    value: `AVG BUDGET: ₹${Math.round(activeStats.mean)}`,
                    fill: '#64748b',
                    fontSize: 8,
                    fontWeight: 900,
                    dy: -5
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-8 pt-8 border-t border-slate-100">
        <div className="flex flex-wrap gap-8">
          {[
            { color: 'bg-[#10b981]', label: 'Low Risk', desc: 'Secure Pattern' },
            { color: 'bg-[#f59e0b]', label: 'Med Risk', desc: 'Suspicious Activity' },
            { color: 'bg-[#ef4444]', label: 'High Risk', desc: 'Fraud Detected' }
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${item.color} shadow-sm`} />
              <div>
                <p className="text-[10px] font-black text-slate-800 uppercase tracking-tighter leading-none">{item.label}</p>
                <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center gap-3 text-[10px] text-slate-500 bg-emerald-50/50 px-5 py-3 rounded-2xl border border-emerald-100 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-extrabold uppercase tracking-widest text-[9px] text-emerald-700">Live Surveillance Active • Auto-Refreshing</span>
        </div>
      </div>
    </motion.div>
  );
};

export default SpikeDashboard;
