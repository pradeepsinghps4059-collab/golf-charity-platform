/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        forest: {
          50:  '#f0f7f0',
          100: '#dceddc',
          200: '#bcdabc',
          300: '#90c090',
          400: '#62a262',
          500: '#3d8b3d',
          600: '#2d6e2d',
          700: '#245824',
          800: '#1e461e',
          900: '#183a18',
        },
        gold: {
          50:  '#fdfbf0',
          100: '#faf4d3',
          200: '#f4e89f',
          300: '#edd45f',
          400: '#e5be2a',
          500: '#c9a20d',
          600: '#a07f08',
          700: '#7a5f09',
          800: '#654e0e',
          900: '#554212',
        },
        charcoal: {
          50:  '#f6f6f7',
          100: '#e2e3e6',
          200: '#c4c6cc',
          300: '#9fa3ab',
          400: '#797e89',
          500: '#5e6370',
          600: '#4a4f5b',
          700: '#3d414b',
          800: '#333740',
          900: '#1e2028',
          950: '#13151b',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
