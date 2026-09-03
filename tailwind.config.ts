import type { Config } from "tailwindcss";

// Colors are driven by CSS variables (defined in app/globals.css) so light/dark
// mode switches automatically via prefers-color-scheme, with no `dark:` variants.
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "var(--accent)",
        "accent-light": "var(--accent-light)",
        "accent-strong": "var(--accent-strong)",
        bg: "var(--bg)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        content: "var(--text)",
        muted: "var(--text-secondary)",
        hairline: "var(--border)",
      },
      borderRadius: {
        card: "18px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
    },
  },
  plugins: [],
} satisfies Config;
