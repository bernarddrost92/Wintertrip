import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mission: {
          void: '#050608',
          panel: '#080B10',
          raised: '#0D1118',
        },
        gold: {
          deep: '#D6A223',
          DEFAULT: '#E8B83E',
          bright: '#F4C95D',
          light: '#FFD66B',
        },
        ink: {
          DEFAULT: '#F7F3E8',
          muted: '#8E929B',
        },
      },
      fontFamily: {
        display: ['"Oswald"', '"Bebas Neue"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'gold-sweep': 'linear-gradient(115deg, #D6A223 0%, #F4C95D 45%, #FFD66B 65%, #D6A223 100%)',
        'panel-glow': 'radial-gradient(circle at 50% 0%, rgba(232,184,62,0.10), transparent 60%)',
        'radar-lines':
          'repeating-radial-gradient(circle at center, rgba(232,184,62,0.06) 0, rgba(232,184,62,0.06) 1px, transparent 1px, transparent 64px)',
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(232,184,62,0.35), 0 0 32px -8px rgba(232,184,62,0.35)',
        'gold-lg': '0 0 0 1px rgba(232,184,62,0.45), 0 0 56px -6px rgba(232,184,62,0.5)',
      },
      keyframes: {
        'radar-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'gold-sweep-move': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        'rise-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'radar-spin': 'radar-spin 14s linear infinite',
        'gold-sweep-move': 'gold-sweep-move 3.5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        'rise-in': 'rise-in 0.5s ease-out both',
      },
    },
  },
  plugins: [],
} satisfies Config;
