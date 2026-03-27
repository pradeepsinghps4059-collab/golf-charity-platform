import React from 'react';
import BrandLogo from './BrandLogo';

export default function LoadingSpinner({ fullScreen = false, size = 'md', text = '' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div className={`${sizes[size]} border-2 border-charcoal-700 border-t-forest-500 rounded-full animate-spin`} />
      {text && <p className="text-sm text-charcoal-400 font-body">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950">
        <div className="flex flex-col items-center gap-4">
          <BrandLogo showTagline={false} />
          {spinner}
        </div>
      </div>
    );
  }

  return spinner;
}
