import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--ink-soft) / <alpha-value>)',
        hair: 'rgb(var(--hair) / <alpha-value>)',
        paper: 'rgb(var(--paper) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--surface-2) / <alpha-value>)',
        navy: 'rgb(var(--navy) / <alpha-value>)',
        'navy-ink': 'rgb(var(--navy-ink) / <alpha-value>)',
        brass: 'rgb(var(--brass) / <alpha-value>)',
        clay: 'rgb(var(--clay) / <alpha-value>)',
        good: 'rgb(var(--good) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        ui: ['var(--font-inter)', '-apple-system', 'sans-serif'],
      },
      borderRadius: { lg: '20px', md: '14px', sm: '9px' },
      maxWidth: { app: '480px' },
    },
  },
  plugins: [],
};
export default config;
