import React from 'react';
import { cn } from '../../utils/formatters';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#77D9E8]/50 disabled:opacity-40 disabled:cursor-not-allowed select-none active:scale-[0.985] text-xs';

  const variants = {
    // Primary: Elegant technical accent with subtle cyan rim
    primary: 'bg-[#141C2A] text-[#77D9E8] border border-[#77D9E8]/30 hover:bg-[#1A2538] hover:border-[#77D9E8]/50 shadow-sm shadow-black/40',
    // Solid: Crisp light action
    solid: 'bg-[#F1F3F5] text-[#090B10] font-semibold hover:bg-white shadow-sm hover:shadow',
    // Secondary: Calm graphite surface
    secondary: 'bg-white/[0.04] text-[#E2E8F0] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.14]',
    // Outline: Clean low-contrast
    outline: 'bg-transparent text-[#929AA8] border border-white/[0.08] hover:text-[#F1F3F5] hover:border-white/[0.16] hover:bg-white/[0.02]',
    // Danger: Muted rose/red
    danger: 'bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/18 hover:border-rose-500/35',
    // Success: Muted emerald
    success: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/18',
    // Ghost: Zero border, low visual noise
    ghost: 'bg-transparent text-[#929AA8] hover:text-[#F1F3F5] hover:bg-white/[0.05]'
  };

  const sizes = {
    xs: 'text-[11px] px-2 py-1 gap-1.5',
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs px-3.5 py-2 gap-2',
    lg: 'text-sm px-4 py-2.5 gap-2.5'
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-3.5 h-3.5 shrink-0 stroke-[1.75]" />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-3.5 h-3.5 shrink-0 stroke-[1.75]" />}
    </button>
  );
}
