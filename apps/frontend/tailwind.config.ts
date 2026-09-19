import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#111215',
        card: '#18191e',
        cardBorder: '#23242b',
        accentSubtle: '#1f2027',
        primary: {
          500: '#5258e4',
          600: '#4349cf',
          DEFAULT: '#5258e4',
        },
      },
    },
  },
  plugins: [],
};

export default config;
