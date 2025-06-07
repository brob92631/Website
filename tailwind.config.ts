import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { background: 'hsl(0 0% 4%)', foreground: 'hsl(0 0% 95%)', card: 'hsl(0 0% 8%)', 'card-hover': 'hsl(0 0% 12%)', primary: 'hsl(204 100% 50%)' }, backgroundImage: { 'gradient-radial': 'radial-gradient(circle, hsl(0 0% 8%) 0%, hsl(0 0% 4%) 100%)' } } },
  plugins: [],
};
export default config;
