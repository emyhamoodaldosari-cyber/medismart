import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
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
