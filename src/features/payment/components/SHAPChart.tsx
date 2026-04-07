import React from 'react';
import { motion } from 'framer-motion';
import type { FeatureImportance } from '@/types';

interface SHAPChartProps {
  features: FeatureImportance[];
}

export const SHAPChart: React.FC<SHAPChartProps> = ({ features }) => {
  const maxImportance = Math.max(...features.map(f => f.importance), 0.01);

  return (
    <div className="glass-card-elevated rounded-2xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">SHAP Feature Importance</h3>
      <p className="text-xs text-muted-foreground mb-4">Why this transaction was flagged</p>
      <div className="space-y-3">
        {features.map((f, i) => (
          <motion.div
            key={`${f.feature}-${i}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground">{f.feature}</span>
              <span className={`text-xs ${f.direction === 'increases' ? 'text-destructive' : 'text-success'}`}>
                {f.direction === 'increases' ? '↑' : '↓'} {f.value}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${f.direction === 'increases' ? 'bg-destructive' : 'bg-success'}`}
                initial={{ width: 0 }}
                animate={{ width: `${(f.importance / maxImportance) * 100}%` }}
                transition={{ delay: i * 0.08 + 0.2, duration: 0.5 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
