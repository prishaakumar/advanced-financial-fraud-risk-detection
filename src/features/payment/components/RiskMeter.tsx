import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RiskMeterProps {
  score: number; // 0-1
  reasons?: string[];
}

export const RiskMeter: React.FC<RiskMeterProps> = ({ score, reasons = [] }) => {
  const percentage = Math.round(score * 100);

  const getLabel = () => {
    if (score < 0.35) return 'Low Risk';
    if (score < 0.6) return 'Medium Risk';
    return 'High Risk';
  };

  const getTextColor = () => {
    if (score < 0.35) return 'text-emerald-500';
    if (score < 0.6) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getGlowColor = () => {
    if (score < 0.35) return 'shadow-emerald-500/20';
    if (score < 0.6) return 'shadow-amber-500/40';
    return 'shadow-rose-500/50';
  };

  return (
    <div className={`glass-card-elevated rounded-2xl p-5 mb-6 transition-all duration-500 border-l-4 ${score < 0.35 ? 'border-emerald-500' : score < 0.6 ? 'border-amber-500' : 'border-rose-500'
      } ${getGlowColor()} shadow-lg`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Real-time Analysis</span>
          <span className={`text-lg font-black tracking-tight ${getTextColor()}`}>{getLabel()}</span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-foreground tabular-nums">{percentage}%</span>
          <p className="text-[10px] text-muted-foreground font-medium -mt-1 uppercase tracking-wider">Scrutiny Level</p>
        </div>
      </div>

      <div className="relative h-4 w-full rounded-full bg-secondary/30 overflow-hidden backdrop-blur-sm border border-white/5">
        {/* The Gradient Track */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 opacity-20" />

        {/* The Animated Fill */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 shadow-[0_0_15px_rgba(0,0,0,0.2)]"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        >
          {/* Scanning Effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-20"
            animate={{ left: ['-100%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>

        {/* The "Current Value" Indicator/Needle Effect */}
        <motion.div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white] z-10"
          animate={{ left: `${percentage}%` }}
          transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        />
      </div>

      <AnimatePresence>
        {reasons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {reasons.map((reason, i) => (
              <motion.span
                key={reason}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-[10px] font-bold px-2 py-1 rounded-md border backdrop-blur-md uppercase tracking-tighter ${score < 0.35
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  : score < 0.6
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  }`}
              >
                {reason}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {score >= 0.4 && (
        <motion.div
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${score < 0.6 ? 'text-amber-500' : 'text-rose-500'
            }`}
        >
          <div className={`h-1.5 w-1.5 rounded-full ${score < 0.6 ? 'bg-amber-500' : 'bg-rose-500'}`} />
          {score < 0.6 ? 'Sensitive Analysis Active' : 'Critical Threat Detected'}
        </motion.div>
      )}
    </div>
  );
};
