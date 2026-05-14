/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/webapp/**/*.{html,tsx,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      colors: {
        // Dark backgrounds — deeper, richer
        'bg-primary':    '#04070F',
        'bg-card':       '#09132A',
        'bg-card-hover': '#0E1A38',
        'bg-input':      '#0A1226',

        // Accent blues — more vibrant
        'accent-blue':        '#1A5FFF',
        'accent-blue-bright': '#52A3FF',
        'accent-blue-pale':   '#B8D9FF',
        'accent-blue-glow':   'rgba(30, 100, 255, 0.38)',

        // Accent secondary
        'accent-cyan':   '#00D4FF',
        'accent-purple': '#7C3AED',

        // Status colors
        'status-green':  '#34C759',
        'status-orange': '#FF9500',
        'status-red':    '#FF3B30',
        'status-yellow': '#FFD60A',
        'status-gold':   '#F5A623',

        // Text
        'text-secondary': 'rgba(255,255,255,0.58)',
        'text-muted':     'rgba(255,255,255,0.32)',

        // Borders
        'border-subtle':  'rgba(255,255,255,0.07)',
        'border-card':    'rgba(82, 163, 255, 0.18)',
        'border-active':  'rgba(82, 163, 255, 0.5)',
        'border-nav':     'rgba(82, 163, 255, 0.14)',
      },
      borderRadius: {
        'card': '20px',
        'btn':  '16px',
        'xl2':  '20px',
      },
      boxShadow: {
        'card':       '0 0 0 1px rgba(82,163,255,0.14), 0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 0 28px rgba(30,100,255,0.22), 0 8px 32px rgba(0,0,0,0.5)',
        'btn-glow':   '0 4px 28px rgba(30,100,255,0.5)',
        'glow-sm':    '0 0 10px rgba(30,100,255,0.65)',
        'glow-md':    '0 0 20px rgba(30,100,255,0.5)',
        'glow-lg':    '0 0 40px rgba(30,100,255,0.5)',
        'icon-glow':  '0 0 20px rgba(30,100,255,0.45)',
        'gold-glow':  '0 0 20px rgba(245,166,35,0.4)',
      },
      animation: {
        'fade-up':    'fadeUp 0.45s ease-out',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'shimmer':    'shimmer 1.6s linear infinite',
        'breathe':    'breathe 4s ease-in-out infinite',
        'pulse-dot':  'pulseDot 2s ease-in-out infinite',
        'flash':      'flash 0.35s ease-out',
        'float':      'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(30,100,255,0.3), 0 0 35px rgba(30,100,255,0.1)' },
          '50%':      { boxShadow: '0 0 24px rgba(30,100,255,0.65), 0 0 70px rgba(30,100,255,0.22)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '100% 0' },
          '100%': { backgroundPosition: '-100% 0' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.6' },
          '50%':      { transform: 'scale(1.05)', opacity: '1' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '0.25', transform: 'scale(0.85)' },
          '50%':      { opacity: '1', transform: 'scale(1.15)' },
        },
        flash: {
          '0%':   { boxShadow: '0 0 0 rgba(30,100,255,0)' },
          '50%':  { boxShadow: '0 0 50px rgba(30,100,255,0.85)' },
          '100%': { boxShadow: '0 0 0 rgba(30,100,255,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
