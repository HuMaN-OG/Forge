import React from 'react';
import { cn } from '../../utils/formatters';

export function StatusIndicator({
  status = 'online', // 'online', 'offline', 'busy', 'warning', 'error'
  label,
  pulse = false,
  className
}) {
  const statusColors = {
    online: 'bg-emerald-400',
    offline: 'bg-slate-500',
    busy: 'bg-[#77D9E8]',
    warning: 'bg-amber-400',
    error: 'bg-rose-400'
  };

  const dot = statusColors[status] || 'bg-slate-500';

  return (
    <div className={cn('inline-flex items-center gap-1.5 text-xs text-[#929AA8]', className)}>
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span className={cn('animate-ping absolute inline-flex h-full w-full rounded-full opacity-60', dot)} />
        )}
        <span className={cn('relative inline-flex rounded-full h-1.5 w-1.5', dot)} />
      </span>
      {label && <span className="text-[11px] font-medium tracking-tight text-[#929AA8]">{label}</span>}
    </div>
  );
}
