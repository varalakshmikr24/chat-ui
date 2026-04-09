import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        chat: {
          dark: "#212121",
          sidebar: "#171717",
          message: {
            user: "#303030",
            bot: "transparent",
          },
          border: "#3d3d3d",
        },
      },
      maxWidth: {
        "3xl": "48rem",
      },
    },
  },
  plugins: [],
};

export default config;
