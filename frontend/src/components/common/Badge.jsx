import React from 'react';
import { cn } from '../../utils/formatters';

export function Badge({ children, variant = 'neutral', className, icon: Icon, dot = false, ...props }) {
  const variants = {
    cyan: 'bg-[#77D9E8]/10 text-[#77D9E8] border-[#77D9E8]/20',
    blue: 'bg-[#6EA8FF]/10 text-[#6EA8FF] border-[#6EA8FF]/20',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
    neutral: 'bg-white/[0.04] text-[#929AA8] border-white/[0.07]',
    outline: 'bg-transparent text-[#929AA8] border-white/[0.08]'
  };

  const dotColors = {
    cyan: 'bg-[#77D9E8]',
    blue: 'bg-[#6EA8FF]',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    neutral: 'bg-slate-400',
    outline: 'bg-slate-400'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium tracking-tight border transition-colors',
        variants[variant] || variants.neutral,
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant] || 'bg-slate-400')} />
      )}
      {Icon && <Icon className="w-3 h-3 shrink-0 stroke-[1.75]" />}
      <span>{children}</span>
    </span>
  );
}
