/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html', 
    './src/**/*.{ts,tsx,js,jsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom color palette for mining theme
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        mining: {
          gold: '#ffd700',
          copper: '#b87333',
          silver: '#c0c0c0',
          platinum: '#e5e4e2',
          diamond: '#b9f2ff',
        },
        cyber: {
          cyan: '#00ffff',
          purple: '#8b5cf6',
          pink: '#ec4899',
          blue: '#3b82f6',
          green: '#10b981',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(6, 182, 212, 0.3)',
        'glow-lg': '0 0 30px rgba(6, 182, 212, 0.4)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
        'glow-yellow': '0 0 20px rgba(234, 179, 8, 0.3)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
        'inner-glow': 'inset 0 0 20px rgba(6, 182, 212, 0.1)',
        'cyber': '0 0 30px rgba(0, 255, 255, 0.5), 0 0 60px rgba(0, 255, 255, 0.3)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'spin-reverse': 'spin 1s linear infinite reverse',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'mining-pulse': 'mining-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'energy-flow': 'energy-flow 2s linear infinite',
        'holographic': 'holographic 4s ease-in-out infinite',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(6, 182, 212, 0.6)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'mining-pulse': {
          '0%, 100%': { 
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': { 
            opacity: '0.7',
            transform: 'scale(1.05)',
          },
        },
        'energy-flow': {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
        holographic: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        sparkle: {
          '0%, 100%': { 
            opacity: '0',
            transform: 'scale(0.5) rotate(0deg)',
          },
          '50%': { 
            opacity: '1',
            transform: 'scale(1) rotate(180deg)',
          },
        },
      },
      backdropBlur: {
        'xs': '2px',
        '3xl': '64px',
      },
      gradientColorStops: {
        'cyber-start': '#06b6d4',
        'cyber-middle': '#8b5cf6',
        'cyber-end': '#ec4899',
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
        'mobile-only': { 'max': '767px' },
        'tablet-only': { 'min': '768px', 'max': '1023px' },
        'desktop-only': { 'min': '1024px' },
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    // Custom utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.text-shadow': {
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
        },
        '.text-shadow-lg': {
          textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
        },
        '.text-shadow-none': {
          textShadow: 'none',
        },
        '.glass': {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
        },
        '.border-gradient': {
          border: '1px solid transparent',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05)) padding-box, linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(6, 182, 212, 0.3)) border-box',
        },
        '.holographic-text': {
          background: 'linear-gradient(45deg, #06b6d4, #8b5cf6, #ec4899, #06b6d4)',
          backgroundSize: '400% 400%',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'holographic 4s ease-in-out infinite',
        },
        '.mining-glow': {
          boxShadow: '0 0 20px rgba(6, 182, 212, 0.3), 0 0 40px rgba(6, 182, 212, 0.2), inset 0 0 20px rgba(6, 182, 212, 0.1)',
        },
        '.safe-area-top': {
          paddingTop: 'env(safe-area-inset-top)',
        },
        '.safe-area-bottom': {
          paddingBottom: 'env(safe-area-inset-bottom)',
        },
        '.safe-area-left': {
          paddingLeft: 'env(safe-area-inset-left)',
        },
        '.safe-area-right': {
          paddingRight: 'env(safe-area-inset-right)',
        },
      };
      
      addUtilities(newUtilities);
    },
    
    // Add component variants
    function({ addComponents, theme }) {
      addComponents({
        '.btn': {
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          borderRadius: theme('borderRadius.xl'),
          fontWeight: theme('fontWeight.semibold'),
          transition: 'all 0.2s ease',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme('spacing.2'),
          '&:focus': {
            outline: 'none',
            ringWidth: '2px',
            ringColor: theme('colors.cyan.500'),
            ringOpacity: '0.5',
            ringOffsetWidth: '2px',
            ringOffsetColor: 'transparent',
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
        '.btn-primary': {
          background: `linear-gradient(to right, ${theme('colors.cyan.500')}, ${theme('colors.blue.600')})`,
          color: theme('colors.white'),
          boxShadow: theme('boxShadow.glow'),
          '&:hover': {
            background: `linear-gradient(to right, ${theme('colors.cyan.600')}, ${theme('colors.blue.700')})`,
            transform: 'scale(1.02)',
          },
        },
        '.btn-secondary': {
          background: `linear-gradient(to right, ${theme('colors.purple.500')}20, ${theme('colors.pink.500')}20)`,
          color: theme('colors.purple.200'),
          border: `1px solid ${theme('colors.purple.500')}30`,
          backdropFilter: 'blur(10px)',
        },
        '.card': {
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme('colors.cyan.500')}20`,
          borderRadius: theme('borderRadius.2xl'),
          boxShadow: theme('boxShadow.2xl'),
        },
      });
    },
  ],
};
