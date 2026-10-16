import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Quiet 007: matte charcoal/navy, a step lighter than the old
           bunker, so cards lift off the room instead of melting into it. */
        mission: {
          void: '#181C22',
          deep: '#14181E',
          panel: '#232932',
          soft: '#282F39',
          raised: '#303844',
          line: '#39414D',
        },
        /* Gold is reserved for meaning — active state, key metric, CTA,
           target, winner — never for every border. */
        gold: {
          deep: '#A9843A',
          DEFAULT: '#D6AE55',
          bright: '#E7C875',
          light: '#FFD768',
          highlight: '#FFE38A',
        },
        silver: {
          deep: '#8B929C',
          DEFAULT: '#C0C6CE',
          bright: '#E8ECF0',
        },
        bronze: {
          deep: '#8C5A2B',
          DEFAULT: '#CD7F32',
          bright: '#E0A868',
        },
        ink: {
          DEFAULT: '#F4F2EC',
          muted: '#AEB4BD',
          dim: '#858C96',
        },
        status: {
          go: '#3FAE6B',
        },
        /** Projections ("what if") — a cool steel blue, so a projected number
         * can never be mistaken for the official gold/ink stand. */
        intel: {
          DEFAULT: '#8CC2E6',
          deep: '#4E87AE',
        },
      },
      fontFamily: {
        display: ['"Barlow Condensed"', '"Oswald"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      backgroundImage: {
        'gold-sweep': 'linear-gradient(115deg, #B38C3E 0%, #D6AE55 40%, #E7C875 62%, #B38C3E 100%)',
        'panel-glow': 'radial-gradient(circle at 50% 0%, rgba(214,174,85,0.06), transparent 60%)',
        'tactical-grid':
          'linear-gradient(rgba(227,178,60,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(227,178,60,0.09) 1px, transparent 1px)',
        'radar-lines':
          'repeating-radial-gradient(circle at center, rgba(227,178,60,0.06) 0, rgba(227,178,60,0.06) 1px, transparent 1px, transparent 64px)',
        'scan-lines': 'repeating-linear-gradient(180deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 3px)',
      },
      boxShadow: {
        /* Shadow for depth, not glow: a gold hairline plus a soft drop. */
        gold: '0 0 0 1px rgba(214,174,85,0.3), 0 10px 26px -16px rgba(0,0,0,0.7)',
        'gold-lg': '0 0 0 1px rgba(214,174,85,0.38), 0 22px 48px -28px rgba(0,0,0,0.8)',
        'gold-inset': 'inset 0 1px 0 0 rgba(231,200,117,0.1), 0 0 0 1px rgba(214,174,85,0.26)',
        'podium-gold': '0 0 0 1px rgba(214,174,85,0.45), 0 24px 50px -32px rgba(0,0,0,0.8)',
        'podium-silver': '0 0 0 1px rgba(192,198,206,0.32), 0 24px 50px -32px rgba(0,0,0,0.8)',
        'podium-bronze': '0 0 0 1px rgba(205,127,50,0.32), 0 24px 50px -32px rgba(0,0,0,0.8)',
        calm: '0 18px 48px -34px rgba(0,0,0,0.7)',
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
        'factor-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(255,215,104,0.45)' },
          '60%': { boxShadow: '0 0 0 14px rgba(255,215,104,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(255,215,104,0)' },
        },
        'podium-pulse-gold': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        'podium-pulse-bronze': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '0.8' },
        },
        'podium-flare': {
          '0%, 92%, 100%': { transform: 'translateX(-120%)', opacity: '0' },
          '95%': { opacity: '0.9' },
          '98%': { transform: 'translateX(120%)', opacity: '0' },
        },
        'podium-shimmer-silver': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.7' },
        },
        /* HUNT MODE only — Quiet Mode never uses these. Transform/opacity only. */
        'confetti-fall': {
          '0%': { transform: 'translate3d(0, -12vh, 0) rotate(0deg)', opacity: '1' },
          '80%': { opacity: '1' },
          '100%': { transform: 'translate3d(var(--confetti-drift, 0px), 108vh, 0) rotate(var(--confetti-spin, 540deg))', opacity: '0' },
        },
        'gold-flash': {
          '0%': { opacity: '0' },
          '22%': { opacity: '0.42' },
          '100%': { opacity: '0' },
        },
        'target-lock': {
          '0%': { opacity: '0', transform: 'scale(1.18)' },
          '60%': { opacity: '1', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'hunt-grid-drift': {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(0, 64px, 0)' },
        },
        'hunt-scan': {
          '0%': { transform: 'translate3d(0, -10vh, 0)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translate3d(0, 110vh, 0)', opacity: '0' },
        },
        'hunt-ping': {
          '0%': { transform: 'scale(0.6)', opacity: '0.8' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        'hunt-rise': {
          '0%': { opacity: '0', transform: 'translate3d(0, 18px, 0) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0) scale(1)' },
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
        'podium-pulse-gold': 'podium-pulse-gold 4s ease-in-out infinite',
        'podium-pulse-bronze': 'podium-pulse-bronze 5s ease-in-out infinite',
        'podium-flare': 'podium-flare 8s ease-in-out infinite',
        'podium-shimmer-silver': 'podium-shimmer-silver 6s ease-in-out infinite',
        'confetti-fall': 'confetti-fall 1.6s cubic-bezier(0.25, 0.6, 0.4, 1) both',
        'gold-flash': 'gold-flash 0.65s ease-out both',
        'target-lock': 'target-lock 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        'hunt-grid-drift': 'hunt-grid-drift 6s linear infinite',
        'hunt-scan': 'hunt-scan 7s linear infinite',
        'hunt-ping': 'hunt-ping 2.2s ease-out infinite',
        'hunt-rise': 'hunt-rise 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both',
      },
    },
  },
  plugins: [],
} satisfies Config;
