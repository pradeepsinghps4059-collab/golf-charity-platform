const categoryThemes = {
  education: {
    icon: 'BOOK',
    start: '#245e8b',
    end: '#5f8fb0',
  },
  health: {
    icon: 'CARE',
    start: '#1f6f68',
    end: '#4aa193',
  },
  hunger: {
    icon: 'MEAL',
    start: '#8b4b27',
    end: '#d18442',
  },
  relief: {
    icon: 'AID',
    start: '#7c4d25',
    end: '#c88a56',
  },
  environment: {
    icon: 'EARTH',
    start: '#21534f',
    end: '#4a8f83',
  },
  community: {
    icon: 'UNITY',
    start: '#3f5986',
    end: '#7899c8',
  },
  general: {
    icon: 'GIVE',
    start: '#2f5d8a',
    end: '#bf6130',
  },
};

const escapeXml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

const buildFallbackSvg = (name, category, theme) => {
  const safeName = escapeXml(name || 'Charity');
  const safeCategory = escapeXml(category || 'General');
  const safeIcon = escapeXml(theme.icon);

  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">',
    '<defs>',
    `<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">`,
    `<stop offset="0%" stop-color="${theme.start}" />`,
    `<stop offset="100%" stop-color="${theme.end}" />`,
    '</linearGradient>',
    '</defs>',
    '<rect width="1200" height="800" rx="36" fill="#101720" />',
    '<rect x="28" y="28" width="1144" height="744" rx="30" fill="url(#bg)" opacity="0.92" />',
    '<circle cx="940" cy="170" r="170" fill="#ffffff" opacity="0.08" />',
    '<circle cx="220" cy="650" r="220" fill="#ffffff" opacity="0.07" />',
    '<rect x="90" y="110" width="182" height="182" rx="32" fill="#ffffff" opacity="0.18" />',
    `<text x="181" y="205" text-anchor="middle" fill="#ffffff" font-size="34" font-family="Arial, sans-serif" font-weight="700" letter-spacing="5">${safeIcon}</text>`,
    `<text x="90" y="395" fill="#ffffff" font-size="64" font-family="Georgia, serif" font-weight="700">${safeName}</text>`,
    `<text x="90" y="455" fill="#f3f5f7" font-size="30" font-family="Arial, sans-serif" opacity="0.86" letter-spacing="4">${safeCategory.toUpperCase()}</text>`,
    '<path d="M90 520 C210 470 340 470 470 520" stroke="#ffffff" stroke-opacity="0.38" stroke-width="8" fill="none" stroke-linecap="round" />',
    '</svg>',
  ].join('');
};

export const getCharityVisual = (charity = {}) => {
  const categoryKey = String(charity.category || 'general').trim().toLowerCase();
  const theme = categoryThemes[categoryKey] || categoryThemes.general;
  const fallbackSvg = buildFallbackSvg(charity.name, charity.category, theme);
  const fallbackImage = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(fallbackSvg)}`;

  return {
    imageSrc: charity.image || fallbackImage,
    imageAlt: charity.name || 'Charity image',
  };
};
