/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        matrix: {
          black: '#0D0D0D',
          'black-soft': '#1A1A2E',
          'black-hover': '#16213E',
          green: '#22C55E',
          'dark-green': '#166534',
          neon: '#10B981',
        },
        agent: {
          master: '#8B5CF6',
          pesquisa: '#2563EB',
          organizador: '#059669',
          solucoes: '#F59E0B',
          estruturas: '#374151',
          financeiro: '#10B981',
          closer: '#DC2626',
          apresentacao: '#EC4899',
        },
        gold: '#F59E0B',
      },
      fontFamily: {
        ui: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        pixel: ['"Press Start 2P"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 10px rgba(34, 197, 94, 0.3)',
        'glow-lg': '0 0 20px rgba(34, 197, 94, 0.3), 0 0 40px rgba(34, 197, 94, 0.15)',
        'glow-gold': '0 0 10px rgba(245, 158, 11, 0.4)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float-up': 'floatUp 1s ease-out forwards',
        'fade-in': 'fadeIn 0.2s ease-out forwards',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(34, 197, 94, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(34, 197, 94, 0.6)' },
        },
        floatUp: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-20px)', opacity: '0' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
