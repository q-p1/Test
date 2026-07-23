/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // 8px spacing system: Tailwind's default scale is 4px-based and contains
      // every 8px multiple (2=8, 4=16, 6=24, 8=32 …). We only add the one step
      // the design needs beyond defaults so all utilities resolve cleanly.
      spacing: {
        13: '3.25rem', // 52px — primary CTA/control height
      },
      // Broaden the opacity scale so color/border opacity modifiers used across
      // the design (e.g. /8, /12, /15, /45, /55, /85) all generate.
      opacity: {
        8: '0.08',
        12: '0.12',
        15: '0.15',
        35: '0.35',
        45: '0.45',
        55: '0.55',
        62: '0.62',
        65: '0.65',
        85: '0.85',
        88: '0.88',
      },
      colors: {
        // Warm paper + near-black ink — minimal luxury base
        paper: {
          DEFAULT: '#F6F4EF',
          50: '#FBFAF7',
          100: '#F6F4EF',
          200: '#EDEAE2',
          300: '#E2DED3',
        },
        ink: {
          DEFAULT: '#0B0B0F',
          950: '#0B0B0F',
          900: '#141419',
          800: '#1F1F27',
          700: '#2C2C36',
          600: '#4A4A57',
          500: '#6B6B78',
          400: '#8E8E9A',
          300: '#B4B4BE',
          200: '#D6D6DD',
        },
        // Single signature accent — refined indigo→violet
        accent: {
          DEFAULT: '#4F46E5',
          50: '#EEEDFE',
          100: '#DEDCFC',
          200: '#BFBAF9',
          300: '#9E97F3',
          400: '#7C71EC',
          500: '#4F46E5',
          600: '#3F38C4',
          700: '#322CA0',
          800: '#26227A',
          900: '#1B1856',
        },
        // Warm champagne — luxury micro-accent for trust/premium details
        gold: {
          DEFAULT: '#C9A96A',
          soft: '#E4D3AE',
          deep: '#A8894C',
        },
        success: '#1F9D6B',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Arabic"', 'system-ui', 'sans-serif'],
        display: ['"Tajawal"', '"IBM Plex Sans Arabic"', 'sans-serif'],
      },
      fontSize: {
        // Fluid, confident scale
        'display-2xl': ['clamp(3rem, 7vw, 6.5rem)', { lineHeight: '0.98', letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-xl': ['clamp(2.5rem, 5.5vw, 4.75rem)', { lineHeight: '1.02', letterSpacing: '-0.02em', fontWeight: '800' }],
        'display-lg': ['clamp(2rem, 4.2vw, 3.5rem)', { lineHeight: '1.06', letterSpacing: '-0.015em', fontWeight: '700' }],
        'display-md': ['clamp(1.6rem, 3vw, 2.5rem)', { lineHeight: '1.12', letterSpacing: '-0.01em', fontWeight: '700' }],
        'display-sm': ['clamp(1.35rem, 2.2vw, 1.9rem)', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '700' }],
      },
      borderRadius: {
        xl: '16px',
        '2xl': '20px',
        '3xl': '28px',
        '4xl': '36px',
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(11,11,15,0.06), 0 8px 24px -8px rgba(11,11,15,0.08)',
        card: '0 4px 12px -4px rgba(11,11,15,0.05), 0 16px 40px -16px rgba(11,11,15,0.12)',
        lift: '0 8px 20px -6px rgba(11,11,15,0.10), 0 30px 60px -24px rgba(11,11,15,0.22)',
        glow: '0 10px 40px -10px rgba(79,70,229,0.45)',
        inset: 'inset 0 1px 0 0 rgba(255,255,255,0.6)',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 55%, #A78BFA 100%)',
        'ink-gradient': 'linear-gradient(160deg, #141419 0%, #0B0B0F 100%)',
        'paper-glow': 'radial-gradient(120% 120% at 50% 0%, #FBFAF7 0%, #F6F4EF 55%, #EDEAE2 100%)',
        'mesh': 'radial-gradient(60% 60% at 20% 20%, rgba(124,58,237,0.18) 0%, transparent 60%), radial-gradient(50% 50% at 85% 15%, rgba(79,70,229,0.20) 0%, transparent 55%), radial-gradient(55% 55% at 70% 90%, rgba(201,169,106,0.16) 0%, transparent 60%)',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-soft': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'marquee-rtl': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(50%)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both',
        marquee: 'marquee 40s linear infinite',
        'marquee-rtl': 'marquee-rtl 40s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'spin-slow': 'spin-slow 18s linear infinite',
      },
      maxWidth: {
        content: '1280px',
        prose: '68ch',
      },
    },
  },
  plugins: [],
};
