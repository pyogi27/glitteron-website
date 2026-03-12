import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        white:     '#FAFAF8',
        offwhite:  '#F4F1EB',
        'warm-gray': '#E8E4DC',
        'mid-gray':  '#9A958C',
        dark:      '#1A1714',
        black:     '#0D0C0A',
        gold:      '#C8A96E',
        'gold-light': '#E8D5A3',
        'gold-dark':  '#9A7840',
        'gold-terra': '#C4714A',
        'gold-terra-light': '#E8A87C',
        'gold-terra-dark':  '#8B5E3C',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans:  ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 24px 64px rgba(200,169,110,0.18), 0 8px 24px rgba(13,12,10,0.12)',
        'card-hover': '0 28px 70px rgba(196,113,74,0.25), 0 10px 30px rgba(44,40,37,0.18)',
      },
      keyframes: {
        ticker: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        scrollLine: {
          '0%':   { transform: 'scaleY(0)', transformOrigin: 'top' },
          '50%':  { transform: 'scaleY(1)', transformOrigin: 'top' },
          '51%':  { transform: 'scaleY(1)', transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(0)', transformOrigin: 'bottom' },
        },
        flicker1: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.05)' },
        },
        sway: {
          '0%, 100%': { transform: 'translateX(-50%) rotate(-1deg)' },
          '50%': { transform: 'translateX(-50%) rotate(1deg)' },
        },
      },
      animation: {
        ticker:     'ticker 18s linear infinite',
        scrollLine: 'scrollLine 2s ease-in-out infinite',
        flicker1:   'flicker1 4s ease-in-out infinite',
        sway:       'sway 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
