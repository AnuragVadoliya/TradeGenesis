/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#F97316',
          amber: '#F59E0B',
          dark: '#0D0D0D',
          surface: '#141414',
          card: '#1A1A1A',
          border: '#2A2A2A',
          muted: '#3A3A3A',
        }
      },
      fontFamily: {
        display: ['"Syne"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        glow: {
          from: { boxShadow: '0 0 20px rgba(249,115,22,0.3)' },
          to: { boxShadow: '0 0 40px rgba(249,115,22,0.6)' }
        }
      }
    },
  },
  plugins: [],
}
