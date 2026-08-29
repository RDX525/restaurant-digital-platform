import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pine: {
          50: "#f2f6f4",
          100: "#e0ebe6",
          200: "#c2d7cd",
          300: "#97b8a9",
          400: "#6a9480",
          500: "#4d7764",
          600: "#3c5f50",
          700: "#324d42",
          800: "#2a3f37",
          900: "#1a2f28",
          950: "#0f1c18",
        },
        cream: {
          50: "#fdfcfa",
          100: "#f8f5f0",
          200: "#f0ebe3",
          300: "#e4dcd0",
        },
        gold: {
          300: "#e2d4a8",
          400: "#d4bc7a",
          500: "#c9a962",
          600: "#a68b4b",
        },
        brand: {
          50: "#f2f6f4",
          100: "#e0ebe6",
          500: "#4d7764",
          600: "#3c5f50",
          700: "#324d42",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-instrument-serif)", "Georgia", "serif"],
      },
      boxShadow: {
        soft: "0 2px 20px -4px rgba(26, 47, 40, 0.08)",
        card: "0 4px 24px -6px rgba(26, 47, 40, 0.1)",
        elevated: "0 12px 40px -12px rgba(26, 47, 40, 0.18)",
        glow: "0 0 0 1px rgba(201, 169, 98, 0.15), 0 8px 32px -8px rgba(26, 47, 40, 0.2)",
        inset: "inset 0 1px 0 rgba(255, 255, 255, 0.6)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
        "4xl": "1.5rem",
      },
      backgroundImage: {
        "mesh-light":
          "radial-gradient(at 40% 20%, rgba(201, 169, 98, 0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(77, 119, 100, 0.06) 0px, transparent 45%), radial-gradient(at 0% 50%, rgba(26, 47, 40, 0.04) 0px, transparent 50%)",
        "mesh-dark":
          "radial-gradient(at 20% 30%, rgba(201, 169, 98, 0.12) 0px, transparent 50%), radial-gradient(at 80% 20%, rgba(77, 119, 100, 0.15) 0px, transparent 45%)",
        "gradient-gold":
          "linear-gradient(135deg, #e2d4a8 0%, #c9a962 45%, #d4bc7a 100%)",
        aurora:
          "radial-gradient(ellipse 80% 60% at 20% 30%, rgba(201, 169, 98, 0.18) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 80% 20%, rgba(77, 119, 100, 0.22) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 50% 80%, rgba(201, 169, 98, 0.08) 0%, transparent 50%)",
        "gradient-brand-btn":
          "radial-gradient(ellipse 120% 80% at 8% 8%, rgba(201, 169, 98, 0.24) 0%, transparent 42%), radial-gradient(ellipse 100% 80% at 92% 92%, rgba(77, 119, 100, 0.32) 0%, transparent 42%), linear-gradient(135deg, #3c5f50 0%, #1a2f28 52%, #0f1c18 100%)",
        "gradient-brand-surface":
          "radial-gradient(ellipse 80% 60% at 20% 30%, rgba(201, 169, 98, 0.18) 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 80% 20%, rgba(77, 119, 100, 0.22) 0%, transparent 50%), radial-gradient(ellipse 60% 40% at 50% 80%, rgba(201, 169, 98, 0.08) 0%, transparent 50%), linear-gradient(160deg, #1a2f28 0%, #0f1c18 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        shimmer: "shimmer 2s linear infinite",
        float: "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 2s infinite",
        "glow-pulse": "glowPulse 4s ease-in-out infinite",
        aurora: "aurora 12s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "0.85" },
        },
        aurora: {
          "0%": { transform: "translate(-2%, -2%) scale(1)" },
          "100%": { transform: "translate(2%, 2%) scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
