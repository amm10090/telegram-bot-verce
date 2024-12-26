import type { Config } from "tailwindcss"
import uiConfig from "../../packages/ui/tailwind.config"

const config = {
  ...uiConfig,
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
} satisfies Config

export default config