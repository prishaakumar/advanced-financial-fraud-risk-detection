import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';

interface SpikeGraphProps {
  historicalData: any[];
  newTransaction: number;
}

export const SpikeGraph: React.FC<SpikeGraphProps> = ({ historicalData = [], newTransaction }) => {
  if (!historicalData || historicalData.length === 0) {
    return (
      <div className="glass-card-elevated rounded-2xl p-5 mt-4 text-center">
        <p className="text-xs text-muted-foreground">Insufficient history for spike analysis</p>
      </div>
    );
  }

  // Format data for Recharts
  const data = [
    ...historicalData.map((d, i) => ({
      name: `T-${historicalData.length - i}`,
      amount: typeof d.amount === 'number' ? d.amount : parseFloat(d.amount) || 0,
      isNew: false,
    })),
    { name: 'Current', amount: newTransaction, isNew: true },
  ];

  const avg = historicalData.reduce((sum, d) => sum + (typeof d.amount === 'number' ? d.amount : parseFloat(d.amount) || 0), 0) / historicalData.length;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card-elevated rounded-2xl p-5 mt-4"
    >
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">Spending Spike Analysis</h3>
        <p className="text-xs text-muted-foreground">Current transaction vs. last {historicalData.length} activities</p>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#888' }}
            />
            <YAxis 
              hide 
              domain={[0, (dataMax: number) => Math.max(dataMax * 1.2, newTransaction * 1.1)]} 
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              itemStyle={{ color: '#fff' }}
              formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
            />
            {avg > 0 && (
              <ReferenceLine 
                y={avg} 
                stroke="#666" 
                strokeDasharray="3 3" 
                label={{ position: 'right', value: 'Avg', fill: '#666', fontSize: 10 }} 
              />
            )}
            <Line
              type="monotone"
              dataKey="amount"
              stroke="url(#lineGradient)"
              strokeWidth={3}
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload.isNew) {
                  return (
                    <circle key="new-dot" cx={cx} cy={cy} r={6} fill="#ef4444" stroke="white" strokeWidth={2} className="animate-pulse" />
                  );
                }
                return <circle key={`dot-${props.index}`} cx={cx} cy={cy} r={3} fill="#888" />;
              }}
              activeDot={{ r: 8 }}
            />
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="80%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {avg > 0 && newTransaction > avg * 1.5 && (
        <div className="mt-3 text-[10px] font-bold text-destructive uppercase tracking-widest flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-destructive animate-ping" />
          Detected { (newTransaction/avg).toFixed(1) }x increase from average spend
        </div>
      )}
    </motion.div>
  );
};
