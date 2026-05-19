import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        ring: "var(--ring)",
        success: {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
        },
        ghost: {
          ivory: "#F7F4EF",
          cream: "#EDE9E2",
          pine: "#2C4A3E",
          sage: "#4A7C6B",
          mist: "#8FA89F",
          gold: "#C9A96E",
          sand: "#D4C4A8",
          ink: "#1A1917",
          smoke: "#6B6560",
          veil: "#A8A49F",
          error: "#8C3A2F"
        }
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"]
      },
      borderRadius: {
        md: "10px",
        lg: "16px",
        xl: "24px"
      },
      boxShadow: {
        soft: "0 18px 40px rgba(44,74,62,0.08)"
      },
      transitionTimingFunction: {
        ghost: "cubic-bezier(0.16, 1, 0.3, 1)"
      }
    }
  },
  plugins: []
};

export default config;
