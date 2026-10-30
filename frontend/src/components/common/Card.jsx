import React from 'react';
import { cn } from '../../utils/formatters';

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl bg-[#10141D] border border-white/[0.06] transition-colors',
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
      className={cn('px-4 py-3.5 border-b border-white/[0.05] flex items-center justify-between', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className, ...props }) {
  return (
    <h3
      className={cn('text-xs font-semibold text-[#F1F3F5] tracking-tight flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className, ...props }) {
  return (
    <p className={cn('text-[11px] text-[#687180] mt-0.5 leading-relaxed', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className, ...props }) {
  return (
    <div className={cn('p-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className, ...props }) {
  return (
    <div
      className={cn('px-4 py-2.5 bg-white/[0.015] border-t border-white/[0.05] rounded-b-xl flex items-center justify-between text-xs', className)}
      {...props}
    >
      {children}
    </div>
  );
}
