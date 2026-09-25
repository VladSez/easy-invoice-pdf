import type { Config } from "tailwindcss";

// relative, not `@/`: Tailwind loads this config through jiti, which does not resolve
// the tsconfig path aliases
import { hitAreaPlugin } from "./src/lib/tailwind-hit-area-plugin";

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
      // Inline `code` in prose (changelog posts): drop the plugin's literal backtick
      // pseudo-elements and render it as a quiet chip instead.
      typography: ({ theme }: { theme: (path: string) => string }) => {
        return {
          DEFAULT: {
            css: {
              code: {
                fontWeight: "500",
                color: theme("colors.gray.900"),
                fontSize: "0.875em",
                backgroundColor: theme("colors.gray.100"),
                border: `1px solid ${theme("colors.gray.300")}`,
                borderRadius: "0.375rem",
                padding: "0.125rem 0.375rem",
                // keeps the padding and border on both halves when a chip wraps
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
              },
              "code::before": { content: "none" },
              "code::after": { content: "none" },
            },
          },
          invert: {
            css: {
              code: {
                backgroundColor: theme("colors.gray.800"),
                color: theme("colors.gray.50"),
                borderColor: theme("colors.gray.700"),
              },
            },
          },
        };
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      transitionTimingFunction: {
        // Strong ease-out. The built-in `ease-out` is too weak to read as intentional.
        "out-strong": "cubic-bezier(0.23, 1, 0.32, 1)",
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
        "star-hover": {
          "0%, 100%": {
            transform: "scale(1)",
            fill: "rgb(250 204 21)", // fill-yellow-400
            color: "rgb(234 179 8)", // text-yellow-500
            filter: "none",
          },
          "50%": {
            transform: "scale(1.1)",
            fill: "rgb(255 215 0)", // gold
            color: "rgb(255 165 0)", // orange-gold
            filter:
              "drop-shadow(0 2px 4px rgb(255 215 0 / 0.3)) drop-shadow(0 1px 2px rgb(255 165 0 / 0.2)) brightness(1.1)",
          },
        },
        "rotate-shine": {
          "0%": {
            opacity: "0",
            transform: "rotate(0deg) translate(-50%, -50%)",
          },
          "60%": {
            opacity: "0",
            transform: "rotate(0deg) translate(-50%, -50%)",
          },
          "66%": { opacity: "0.15" },
          "72%": { opacity: "1" },
          "80%": { opacity: "1" },
          "92%": { opacity: "0" },
          "100%": {
            opacity: "0",
            transform: "rotate(360deg) translate(-50%, -50%)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        heartbeat: "heartbeat 3s ease-in-out infinite 5s", // 3s = duration of animation, infinite = repeat forever, 5s = delay before starting animation,
        "pulse-arrow": "pulse-arrow 5s infinite",
        "star-hover": "star-hover 2s ease-in-out infinite 6s",
        "rotate-shine": "rotate-shine 5s ease-in-out infinite",
      },
    },
  },
  plugins: [
    // tailwind v3 resolves published plugins through CJS `require`
    // oxlint-disable-next-line typescript/no-require-imports
    require("tailwindcss-animate"),
    // oxlint-disable-next-line typescript/no-require-imports
    require("@tailwindcss/typography"),
    hitAreaPlugin,
  ],
};
export default config;
