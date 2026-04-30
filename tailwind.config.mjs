/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Brand: purple → pink gradient
        brand: {
          purple: '#7C3AED',
          pink: '#DB2777',
        },
        ink: {
          950: '#0a0a0f',
          900: '#13131a',
          800: '#1c1c26',
          700: '#2a2a37',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
