/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        lemon: '#F5E663',
        lavender: {
          DEFAULT: '#8B7CFF',
          electric: '#8B7CFF',
          deep: '#4B3BD1'
        },
        charcoal: {
          DEFAULT: '#1B1B1F',
          50: '#2A2A30',
          100: '#232328',
          200: '#1B1B1F',
          300: '#141417'
        },
        cream: {
          DEFAULT: '#FFF8E6',
          50: '#FFFFF4',
          100: '#FFF8E6',
          200: '#F5ECCB',
          300: '#EBDFA8'
        },
        chilli: '#E8502F',
        basil: '#1F6F54',
        whatsapp: '#25D366',
        mist: '#E9E6DD'
      },
      fontFamily: {
        display: ['"DM Serif Display"', '"Abril Fatface"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif']
      },
      borderRadius: {
        'squircle-sm': '20px',
        'squircle': '28px',
        'squircle-lg': '32px'
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-subtle': 'pulseSubtle 2s infinite ease-in-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' }
        }
      }
    }
  },
  plugins: []
};
