/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette for the app
        'bg-primary': '#0f0f23',
        'bg-secondary': '#1a1a3e',
        'accent-cyan': '#06b6d4',
        'accent-purple': '#8b5cf6',
      },
      animation: {
        'mining-pulse': 'mining-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'energy-flow': 'energy-flow 2s linear infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'holographic': 'holographic 4s ease-in-out infinite',
        'mining-particles': 'mining-particles 2s linear infinite',
      },
      keyframes: {
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
          '0%': {
            left: '-100%',
          },
          '100%': {
            left: '100%',
          },
        },
        'shimmer': {
          '0%': {
            left: '-100%',
          },
          '50%': {
            left: '100%',
          },
          '100%': {
            left: '100%',
          },
        },
        'float': {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        'holographic': {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
        },
      },
    },
  },
  plugins: [],
}
