/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'gradient-xy': 'gradient-xy 15s ease infinite',
        'blob': 'blob 7s infinite',
        'shake': 'shake 0.3s ease-in-out',
      },
      keyframes: {
        'gradient-xy': {
          '0%, 100%': {
            'background-size': '400% 400%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          }
        },
        blob: {
          '0%, 100%': {
            transform: 'translate(0, 0) scale(1)'
          },
          '25%': {
            transform: 'translate(20px, -50px) scale(1.1)'
          },
          '50%': {
            transform: 'translate(-20px, 20px) scale(0.9)'
          },
          '75%': {
            transform: 'translate(50px, 50px) scale(1.05)'
          }
        },
        shake: {
          '0%, 100%': {
            transform: 'translateX(0)'
          },
          '25%': {
            transform: 'translateX(-5px)'
          },
          '75%': {
            transform: 'translateX(5px)'
          }
        }
      }
    },
  },
  plugins: [],
}
