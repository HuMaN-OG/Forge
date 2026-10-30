import React from 'react';

/**
 * FORGE AI — Custom Geometric Brand Mark
 * 
 * An original architectural glyph representing structured intelligence,
 * computational metal being forged, and deterministic execution.
 * Minimal geometry with clean isometric facets.
 */
export function ForgeLogo({ size = 20, className = '', variant = 'default' }) {
  // Variants: 'default' (cyan/blue gradient), 'monochrome' (pure white/gray), 'muted'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="forge-primary-grad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#77D9E8" />
          <stop offset="100%" stopColor="#4F75FF" />
        </linearGradient>
        <linearGradient id="forge-facet-dark" x1="16" y1="12" x2="26" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2E3C54" />
          <stop offset="100%" stopColor="#141923" />
        </linearGradient>
      </defs>

      {variant === 'monochrome' ? (
        // Pure monochromatic geometric silhouette
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M7 8L16 3L25 8V14L16 19L7 14V8Z" />
          <path d="M16 19V29" />
          <path d="M7 14L16 29L25 14" />
          <path d="M16 3V19" />
        </g>
      ) : (
        // Precision faceted glyph
        <g>
          {/* Top Forge Cap */}
          <path
            d="M6 9.5L16 4L26 9.5L16 15L6 9.5Z"
            fill="url(#forge-primary-grad)"
            opacity="0.95"
          />
          {/* Left Anvil Flank */}
          <path
            d="M6 9.5L16 15V27.5L6 17.5V9.5Z"
            fill="url(#forge-primary-grad)"
            fillOpacity="0.45"
          />
          {/* Right Precision Core */}
          <path
            d="M26 9.5L16 15V27.5L26 17.5V9.5Z"
            fill="#1E2838"
            stroke="url(#forge-primary-grad)"
            strokeWidth="1"
            strokeOpacity="0.5"
          />
          {/* Central Keystone Diamond Accent */}
          <path
            d="M16 10L19 13.5L16 17L13 13.5L16 10Z"
            fill="#FFFFFF"
            fillOpacity="0.85"
          />
        </g>
      )}
    </svg>
  );
}

export default ForgeLogo;
