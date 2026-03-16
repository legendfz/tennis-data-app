import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        background: {
          DEFAULT: '#121212',
          surface: '#1E1E1E',
          elevated: '#2C2C2C',
        },
        tennis: {
          green: '#2E7D32',
          'green-light': '#4CAF50',
          'green-dark': '#1B5E20',
        },
        accent: {
          gold: '#FFD700',
        },
        result: {
          win: '#00C853',
          loss: '#FF1744',
        },
        'surface-court': {
          clay: '#E65100',
          grass: '#43A047',
          hard: '#1565C0',
        },
        text: {
          primary: 'rgba(255,255,255,0.87)',
          secondary: 'rgba(255,255,255,0.6)',
          disabled: 'rgba(255,255,255,0.38)',
        },
        divider: 'rgba(255,255,255,0.12)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        chip: '16px',
      },
    },
  },
  plugins: [],
};

export default config;
