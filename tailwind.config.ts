import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: 'var(--color-primary)', hover: 'var(--color-primary-hover)', light: '#FF8E8E' },
        secondary: { DEFAULT: 'var(--color-secondary)', hover: 'var(--color-secondary-hover)', light: '#7EDDD6' },
        accent: { DEFAULT: 'var(--color-accent)', hover: '#FFE033', light: '#FFF0A3' },
        dark: { DEFAULT: 'var(--color-dark)', light: 'var(--color-dark-light)' },
        surface: { DEFAULT: 'var(--color-surface)', alt: 'var(--color-surface-alt)' },
        danger: { DEFAULT: '#FF4757', hover: '#FF3344' },
        purple: { DEFAULT: 'var(--color-purple)', hover: '#9333EA', light: '#C084FC' },
      },
      fontFamily: {
        heading: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neo': '4px 4px 0 0 #2D3436',
        'neo-sm': '2px 2px 0 0 #2D3436',
        'neo-lg': '6px 6px 0 0 #2D3436',
        'neo-hover': '6px 6px 0 0 #2D3436',
      },
      borderWidth: { '3': '3px' },
      borderRadius: { 'none': '0px' },
      animation: {
        'bounce-in': 'bounceIn 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'shake': 'shake 0.4s ease-in-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.2s cubic-bezier(0.2, 0, 0, 1)',
        'squish': 'squish 0.15s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 107, 107, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(255, 107, 107, 0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        squish: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.97)' },
          '100%': { transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}
export default config