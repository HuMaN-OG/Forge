import React from 'react';
import { cn } from '../../utils/formatters';

export function StatusIndicator({
  status = 'online', // 'online', 'offline', 'busy', 'warning', 'error'
  label,
  pulse = false,
  className
}) {
  const statusStyles = {
    online: 'bg-emerald-400',
    offline: 'bg-slate-500',
    busy: 'bg-cyan-400',
    warning: 'bg-amber-400',
    error: 'bg-rose-400'
  };

  const dotColor = statusStyles[status] || 'bg-slate-500';

  return (
    <div className={cn('inline-flex items-center gap-2 text-xs font-medium text-slate-300', className)}>
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-75', dotColor)} />
        )}
        <span className={cn('relative inline-flex rounded-full h-2 w-2', dotColor)} />
      </span>
      {label && <span>{label}</span>}
    </div>
  );
}
