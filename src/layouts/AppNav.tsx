import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CreditCard, Monitor } from 'lucide-react';

export const AppNav: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="glass-card-elevated rounded-2xl flex overflow-hidden">
        <Link
          to="/"
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${
            location.pathname === '/'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Payment
        </Link>
        <Link
          to="/monitor"
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${
            location.pathname === '/monitor'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
        >
          <Monitor className="h-4 w-4" />
          Monitor
        </Link>
      </div>
    </nav>
  );
};
