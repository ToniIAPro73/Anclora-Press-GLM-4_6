import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
        extend: {
                colors: {
                        // Anclora Brand Colors
                        'deep-blue': '#00253F',
                        'teal-dark': '#005872',
                        'vivid-turquoise': '#00B4A0',
                        'teal-500': '#14919B',
                        'teal-400': '#0AD1C8',
                        'mint': '#80ED99',
                        'sand': '#D6BFA2',
                        
                        // AncloraPress specific accent (sand editorial)
                        'press-accent': '#D6BFA2',
                        
                        // UI System Colors
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: '#00B4A0',
                                foreground: '#ffffff'
                        },
                        secondary: {
                                DEFAULT: '#005872',
                                foreground: '#ffffff'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: '#0AD1C8',
                                foreground: '#00253F'
                        },
                        destructive: {
                                DEFAULT: '#dc3545',
                                foreground: '#ffffff'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: '#00B4A0',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        }
                },
                borderRadius: {
                        lg: '28px',
                        md: '24px',
                        sm: '16px'
                },
                fontFamily: {
                        'serif': ['Libre Baskerville', 'serif'],
                        'mono': ['JetBrains Mono', 'monospace']
                },
                spacing: {
                        '18': '4.5rem',
                        '88': '22rem'
                }
        }
  },
  plugins: [tailwindcssAnimate],
};
export default config;
