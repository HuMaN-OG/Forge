import React from 'react';
import { cn } from '../../utils/formatters';

export function Card({ children, className, glow = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl bg-[#0F1626] border border-slate-800/80 transition-all duration-200',
        glow && 'border-cyan-500/40 shadow-lg shadow-cyan-500/10',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, ...props }) {
  return (
    <div
      className={cn('px-5 py-4 border-b border-slate-800/60 flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3
      className={cn('text-base font-semibold text-slate-100 flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={cn('text-xs text-slate-400 mt-0.5', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn('px-5 py-3 bg-slate-900/40 border-t border-slate-800/60 rounded-b-xl flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}
