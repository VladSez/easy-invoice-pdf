import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        heartbeat: {
          "0%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.4)" },
          "50%": { transform: "scale(1)" },
          "75%": { transform: "scale(1.4)" },
          "100%": { transform: "scale(1)" },
        },
        "pulse-arrow": {
          "0%, 70%, 100%": {
            transform: "translateX(0)",
          },
          "75%": {
            transform: "translateX(4px)",
          },
          "80%": {
            transform: "translateX(0)",
          },
          "85%": {
            transform: "translateX(4px)",
          },
          "90%": {
            transform: "translateX(0)",
          },
          "95%": {
            transform: "translateX(4px)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        heartbeat: "heartbeat 3s ease-in-out infinite 5s", // 3s = duration of animation, infinite = repeat forever, 25s = delay before starting animation,
        "pulse-arrow": "pulse-arrow 5s infinite",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
export default config;
