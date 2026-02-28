/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        matrix: {
          black: '#0A0A0A',
          'black-soft': '#111111',
          'black-hover': '#1A1A1A',
          green: '#00FF41',
          'dark-green': '#00CC33',
          neon: '#39FF14',
        },
        accent: {
          cyan: '#06B6D4',
          purple: '#A855F7',
          pink: '#EC4899',
          blue: '#3B82F6',
          emerald: '#10B981',
        },
        agent: {
          master: '#8B5CF6',
          pesquisa: '#3B82F6',
          organizador: '#10B981',
          solucoes: '#F59E0B',
          estruturas: '#64748B',
          financeiro: '#10B981',
          closer: '#EF4444',
          apresentacao: '#EC4899',
        },
        gold: '#F59E0B',
        surface: {
          DEFAULT: '#1A1A1A',
          elevated: 'rgba(26, 26, 26, 0.85)',
          glass: 'rgba(255, 255, 255, 0.03)',
        },
      },
      fontFamily: {
        display: ['Geist', 'system-ui', 'sans-serif'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 15px rgba(0, 255, 65, 0.15), 0 0 45px rgba(0, 255, 65, 0.07)',
        'glow-lg': '0 0 20px rgba(0, 255, 65, 0.25), 0 0 60px rgba(0, 255, 65, 0.12)',
        'glow-gold': '0 0 15px rgba(245, 158, 11, 0.3)',
        'glow-cyan': '0 0 15px rgba(6, 182, 212, 0.3), 0 0 45px rgba(6, 182, 212, 0.1)',
        'glow-purple': '0 0 15px rgba(168, 85, 247, 0.3), 0 0 45px rgba(168, 85, 247, 0.1)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        'card-3d': '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 1px rgba(255, 255, 255, 0.08)',
      },
      backdropBlur: {
        glass: '16px',
        'glass-heavy': '24px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'float-up': 'floatUp 1s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'gradient-shift': 'gradientShift 8s ease-in-out infinite',
        'orb-float': 'orbFloat 20s ease-in-out infinite',
        'orb-float-delay': 'orbFloat 25s ease-in-out infinite reverse',
        'shimmer': 'shimmer 2s linear infinite',
        'card-hover': 'cardHover 0.3s ease-out forwards',
        'spin-slow': 'spin 12s linear infinite',
        'grid-pulse': 'gridPulse 4s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(0, 255, 65, 0.15)' },
          '50%': { boxShadow: '0 0 35px rgba(0, 255, 65, 0.3)' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-20px)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        orbFloat: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0, 0) scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        cardHover: {
          '0%': { transform: 'perspective(1000px) rotateX(0) translateY(0)' },
          '100%': { transform: 'perspective(1000px) rotateX(2deg) translateY(-4px)' },
        },
        gridPulse: {
          '0%, 100%': { opacity: '0.06' },
          '50%': { opacity: '0.12' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
