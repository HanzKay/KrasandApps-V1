module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#5A3A2A',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F5EEDC',
          foreground: '#5A3A2A',
        },
        accent: {
          DEFAULT: '#FF7F50',
          foreground: '#FFFFFF',
        },
        destructive: {
          DEFAULT: '#D64545',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#4A7A5E',
          foreground: '#FFFFFF',
        },
        warning: {
          DEFAULT: '#D9A54C',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F0EBE0',
          foreground: '#6B7280',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};