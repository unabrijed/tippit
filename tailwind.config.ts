import type { Config } from "tailwindcss";

const config: Config = {
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
          soft: "var(--accent-soft)",
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
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"]
      },
      borderRadius: {
        md: "10px",
        lg: "16px",
        xl: "24px"
      },
      boxShadow: {
        soft: "0 8px 32px rgba(10,15,30,0.06)",
        card: "0 4px 24px rgba(10,15,30,0.04)",
        glow: "0 0 40px rgba(83,115,255,0.15)",
      },
      transitionTimingFunction: {
        ghost: "cubic-bezier(0.16, 1, 0.3, 1)"
      },
      animation: {
        "enter": "enter 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "scale-in": "scale-in 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "slide-up": "slide-up 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "float": "float 6s ease-in-out infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
      }
    }
  },
  plugins: []
};

export default config;
