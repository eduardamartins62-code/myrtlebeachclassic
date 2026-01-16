import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        pine: {
          50: "#f1fbf4",
          100: "#dbf7e2",
          200: "#b8efc8",
          300: "#84e0a7",
          400: "#4dcb82",
          500: "#1faa5f",
          600: "#14874a",
          700: "#116b3c",
          800: "#0f5532",
          900: "#0b3b24"
        }
      }
    }
  },
  plugins: []
};

export default config;
