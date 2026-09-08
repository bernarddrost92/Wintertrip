import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mission: {
          void: '#030405',
          panel: '#06080A',
          raised: '#0B0E12',
          line: '#11151A',
        },
        gold: {
          deep: '#B8862A',
          DEFAULT: '#E3B23C',
          bright: '#F1C453',
          light: '#FFD768',
          highlight: '#FFE38A',
        },
        ink: {
          DEFAULT: '#F1EFE8',
          muted: '#8F949D',
          dim: '#5C6169',
        },
        status: {
          go: '#3FAE6B',
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', '"Oswald"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'gold-sweep': 'linear-gradient(115deg, #B8862A 0%, #F1C453 45%, #FFD768 65%, #B8862A 100%)',
        'panel-glow': 'radial-gradient(circle at 50% 0%, rgba(227,178,60,0.09), transparent 60%)',
        'tactical-grid':
          'linear-gradient(rgba(227,178,60,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(227,178,60,0.09) 1px, transparent 1px)',
        'radar-lines':
          'repeating-radial-gradient(circle at center, rgba(227,178,60,0.06) 0, rgba(227,178,60,0.06) 1px, transparent 1px, transparent 64px)',
        'scan-lines': 'repeating-linear-gradient(180deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 3px)',
      },
      boxShadow: {
        gold: '0 0 0 1px rgba(227,178,60,0.35), 0 0 32px -8px rgba(227,178,60,0.35)',
        'gold-lg': '0 0 0 1px rgba(227,178,60,0.45), 0 0 56px -6px rgba(227,178,60,0.5)',
        'gold-inset': 'inset 0 1px 0 0 rgba(255,231,138,0.12), 0 0 0 1px rgba(227,178,60,0.3)',
      },
      keyframes: {
        'radar-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)', opacity: '0.9' },
          '100%': { transform: 'rotate(360deg)', opacity: '0.9' },
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
        'trace-line': {
          '0%': { strokeDashoffset: '240' },
          '100%': { strokeDashoffset: '0' },
        },
        'led-blink': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        eq: {
          '0%, 100%': { height: '3px' },
          '50%': { height: '11px' },
        },
        'intro-quickfade': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'photo-shot-one': {
          '0%': { opacity: '0', transform: 'scale(1)' },
          '15%': { opacity: '1', transform: 'scale(1.02)' },
          '77%': { opacity: '1', transform: 'scale(1.07)' },
          '100%': { opacity: '0', transform: 'scale(1.09)' },
        },
        'photo-shot-two': {
          '0%': { opacity: '0', transform: 'scale(1.02)' },
          '23%': { opacity: '1', transform: 'scale(1.04)' },
          '77%': { opacity: '1', transform: 'scale(1.09)' },
          '100%': { opacity: '0', transform: 'scale(1.11)' },
        },
        'photo-shot-three': {
          '0%': { opacity: '0', transform: 'scale(1)', filter: 'brightness(1)' },
          '15%': { opacity: '1', transform: 'scale(1.02)', filter: 'brightness(1.35)' },
          '30%': { filter: 'brightness(1)' },
          '100%': { opacity: '1', transform: 'scale(1.05)', filter: 'brightness(1)' },
        },
        'photo-camera-shake': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(-3px, 2px)' },
          '50%': { transform: 'translate(2px, -2px)' },
          '75%': { transform: 'translate(-2px, -1px)' },
        },
        'photo-flash-pulse': {
          '0%, 100%': { opacity: '0' },
          '50%': { opacity: '0.35' },
        },
        'photo-gold-flood': {
          '0%': { transform: 'translate(-50%, -50%) scale(0)', opacity: '1' },
          '100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '1' },
        },
        'photo-reduced-fade': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'radar-spin': 'radar-spin 18s linear infinite',
        'radar-sweep': 'radar-sweep 5s linear infinite',
        'gold-sweep-move': 'gold-sweep-move 3.5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        'rise-in': 'rise-in 0.45s ease-out both',
        'trace-line': 'trace-line 1.2s ease-out both',
        'led-blink': 'led-blink 2s ease-in-out infinite',
        eq: 'eq 0.9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
