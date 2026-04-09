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
      <div className="bg-card rounded-2xl p-6 mt-4 border border-border/50 shadow-sm text-center">
        <p className="text-xs text-muted-foreground font-medium">Insufficient history for spike analysis</p>
      </div>
    );
  }

  // Format data for Recharts matching the "T-9...Current" labels in the screenshot
  const data = [
    ...historicalData.slice(-9).map((d, i, arr) => ({
      name: `T-${arr.length - i}`,
      amount: typeof d.amount === 'number' ? d.amount : parseFloat(d.amount) || 0,
      isNew: false,
    })),
    { name: 'Current', amount: newTransaction, isNew: true },
  ];

  const avg = historicalData.reduce((sum, d) => sum + (typeof d.amount === 'number' ? d.amount : parseFloat(d.amount) || 0), 0) / historicalData.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl p-6 mt-4 border border-border shadow-md"
    >
      <div className="mb-6">
        <h3 className="text-sm font-bold text-foreground">Spending Spike Analysis</h3>
        <p className="text-[11px] text-muted-foreground font-medium mt-0.5">Current transaction vs. last {historicalData.length} activities</p>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 35, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#888', fontWeight: 500 }}
              dy={10}
            />
            <YAxis 
              hide 
              domain={[0, (dataMax: number) => Math.max(dataMax * 1.3, newTransaction * 1.15)]} 
            />
            <Tooltip
              cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }}
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '11px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                color: '#1a1a1a'
              }}
              formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
            />
            {avg > 0 && (
              <ReferenceLine 
                y={avg} 
                stroke="#94a3b8" 
                strokeDasharray="4 4" 
                label={{ 
                  position: 'right', 
                  value: 'Avg', 
                  fill: '#64748b', 
                  fontSize: 10, 
                  fontWeight: 600,
                  dx: 10
                }} 
              />
            )}
            <Line
              type="monotone"
              dataKey="amount"
              stroke="#3b82f6"
              strokeWidth={3}
              connectNulls
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                if (payload.isNew) {
                  return (
                    <g key="new-dot">
                      <circle cx={cx} cy={cy} r={8} fill="#ef4444" opacity="0.2">
                        <animate attributeName="r" from="6" to="12" dur="1.5s" repeatCount="Infinity" />
                        <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="Infinity" />
                      </circle>
                      <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="white" strokeWidth={2} />
                    </g>
                  );
                }
                return <circle key={`dot-${props.index}`} cx={cx} cy={cy} r={3} fill="#3b82f6" stroke="white" strokeWidth={1} />;
              }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {avg > 0 && newTransaction > avg * 2 && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-destructive/5 px-3 py-2 border border-destructive/10">
          <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          <span className="text-[10px] font-bold text-destructive uppercase tracking-widest">
            Spike Detected: {(newTransaction/avg).toFixed(1)}x above baseline
          </span>
        </div>
      )}
    </motion.div>
  );
};
