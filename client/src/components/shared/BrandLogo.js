import React from 'react';

function LogoMark({ compact = false }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-[22px] bg-gradient-to-br from-forest-500 via-forest-600 to-gold-500 ${compact ? 'h-10 w-10' : 'h-12 w-12'}`}>
      <div className="absolute inset-[3px] rounded-[18px] border border-white/12 bg-charcoal-950/18" />
      <div className="absolute left-1/2 top-1/2 h-[54%] w-[54%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2px] border-white/90" />
      <div className="absolute left-1/2 top-1/2 h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90" />
      <div className="absolute bottom-[18%] right-[18%] h-[20%] w-[20%] rounded-full bg-gold-200/95 shadow-[0_0_12px_rgba(244,232,159,0.55)]" />
    </div>
  );
}

export default function BrandLogo({ compact = false, showTagline = true, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark compact={compact} />
      <div>
        <div className={`font-display font-bold leading-none text-white ${compact ? 'text-lg' : 'text-xl'}`}>Golf Charity</div>
        {showTagline && (
          <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-charcoal-500">
            Play for impact
          </div>
        )}
      </div>
    </div>
  );
}
