import type { Config } from 'tailwindcss';

// Токены взяты пиксельно с эталонного скриншота тёмной темы:
// фон #0F172A, карточки #1E293B, золотой акцент ~#C89632,
// зелёный "открыто" #4ADE80, тёплый янтарный варнинг-бокс.
const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // фон и поверхности
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-raised': 'rgb(var(--color-surface-raised) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        // текст
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--color-ink-muted) / <alpha-value>)',
        // бренд
        gold: {
          DEFAULT: 'rgb(var(--color-gold) / <alpha-value>)',
          muted: 'rgb(var(--color-gold-muted) / <alpha-value>)',
          bg: 'rgb(var(--color-gold-bg) / <alpha-value>)',
        },
        open: {
          DEFAULT: 'rgb(var(--color-open) / <alpha-value>)',
          bg: 'rgb(var(--color-open-bg) / <alpha-value>)',
        },
        warn: {
          DEFAULT: 'rgb(var(--color-warn) / <alpha-value>)',
          bg: 'rgb(var(--color-warn-bg) / <alpha-value>)',
          border: 'rgb(var(--color-warn-border) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'sans-serif'],
      },
      borderRadius: {
        card: '1.25rem',
        pill: '999px',
      },
    },
  },
  plugins: [],
};

export default config;
