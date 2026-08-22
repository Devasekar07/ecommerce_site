import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        paper: "#fbfbf8",
        mist: "#eef0f2",
        berry: "#9f2945",
        leaf: "#2f6b4f"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 16px 45px rgba(21, 21, 21, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
