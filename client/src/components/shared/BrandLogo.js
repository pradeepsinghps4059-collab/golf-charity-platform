import React from 'react';

function LogoMark({ compact = false }) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-[22px] bg-gradient-to-br from-nebula-500 via-nebula-400 to-stargold-400 ${compact ? 'h-10 w-10' : 'h-12 w-12'}`}
         style={{ boxShadow: '0 0 20px rgba(147,51,234,0.3), 0 0 40px rgba(147,51,234,0.1)' }}>
      <div className="absolute inset-[3px] rounded-[18px] border border-white/12 bg-cosmic-900/30" />
      {/* Orbit ring */}
      <div className="absolute left-1/2 top-1/2 h-[54%] w-[54%] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2px] border-white/80" />
      {/* Core star */}
      <div className="absolute left-1/2 top-1/2 h-[18%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90" />
      {/* Orbiting planet */}
      <div className="absolute bottom-[18%] right-[18%] h-[20%] w-[20%] rounded-full bg-stargold-300/95 shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
    </div>
  );
}

export default function BrandLogo({ compact = false, showTagline = true, className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark compact={compact} />
      <div>
        <div className={`font-display font-bold leading-none text-white ${compact ? 'text-lg' : 'text-xl'}`}>
          Golf Charity
        </div>
        {showTagline && (
          <div className="mt-1 text-[11px] uppercase tracking-[0.18em] bg-gradient-to-r from-nebula-300 to-stargold-400 bg-clip-text text-transparent">
            Play for impact
          </div>
        )}
      </div>
    </div>
  );
}
