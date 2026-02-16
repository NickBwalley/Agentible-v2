import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Agentible brand colors from design
        agentible: {
          bg: '#0f1419',
          'bg-elevated': '#111827',
          accent: '#2563EB',
          'accent-glow': '#3b82f6',
          pill: '#1D4ED8',
          border: 'rgba(255,255,255,0.15)',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'accent-glow': '0 0 20px rgba(37, 99, 235, 0.4)',
        'button-glow': '0 0 15px rgba(37, 99, 235, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
