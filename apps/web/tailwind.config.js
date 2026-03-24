/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F1A',
        foreground: '#F8FAFC',
        primary: {
          DEFAULT: '#3B82F6',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#06B6D4',
          foreground: '#0B0F1A',
        },
        muted: '#1E293B',
        mutedForeground: '#94A3B8',
        card: '#1E293B',
        cardForeground: '#F8FAFC',
        border: '#334155',
        destructive: '#EF4444',
        success: '#10B981',
        warning: '#F59E0B',
      },
      boxShadow: {
        glow: '0 0 15px rgba(59, 130, 246, 0.5)',
      },
    },
  },
  plugins: [],
}
