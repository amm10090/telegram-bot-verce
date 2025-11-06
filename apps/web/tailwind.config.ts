import type { Config } from "tailwindcss"
import uiConfig from "../../packages/ui/tailwind.config"

const config = {
  ...uiConfig,
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      ...uiConfig.theme?.extend,
      colors: {
        ...uiConfig.theme?.extend?.colors,
        dark: {
          DEFAULT: '#141414',
          100: '#1C1C1E',
          200: '#2C2C2E',
          300: '#3A3A3C',
        },
        chart: {
          primary: '#8E8E93',
          secondary: '#636366',
          emphasis: '#48484A',
          grid: '#2C2C2E',
        },
      },
      boxShadow: {
        'card-dark': '0 2px 8px rgba(255, 255, 255, 0.05)',
        'card-hover': '0 4px 12px rgba(255, 255, 255, 0.08)',
        'popup-dark': '0 8px 16px rgba(0, 0, 0, 0.2)',
        'input-focus': '0 0 0 2px rgba(255, 255, 255, 0.1)',
      },
      borderRadius: {
        'card': '12px',
      },
      spacing: {
        'card-gap': '16px',
        'card-padding': '24px',
      },
      backdropBlur: {
        'popup': '20px',
      },
      transitionDuration: {
        'default': '200ms',
      },
      opacity: {
        '85': '0.85',
        '60': '0.60',
        '30': '0.30',
        '10': '0.10',
      },
      backgroundImage: {
        'card-gradient': 'linear-gradient(180deg, #1C1C1E 0%, #242426 100%)',
      },
      transitionProperty: {
        'hover': 'all',
      },
      transitionTimingFunction: {
        'hover': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      translate: {
        'hover': '-2px',
      },
    },
  },
  darkMode: "class",
  plugins: [...(uiConfig.plugins || [])]
} satisfies Config

export default config