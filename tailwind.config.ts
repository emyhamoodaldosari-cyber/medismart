import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      heading: ['Outfit', 'sans-serif'],
    },
    extend: {
      colors: {
        pharmacy: {
          light: '#eaf7f1',
          DEFAULT: '#32957a',
          dark: '#1d6753',
        },
        medical: {
          blue: '#d8eefc',
          green: '#ecf7f2',
          accent: '#2a9d8f',
        },
      },
    },
  },
  plugins: [],
};

export default config;
