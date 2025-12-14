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
                        // ===== NUEVA PALETA NÁUTICA ELEGANTE =====
                        // Colores Base
                        'navy': '#083A4F',
                        'gold': '#A8BD66',
                        'aqua': '#C0D5D6',
                        'teal': '#407E8C',
                        'sand': '#E5E1DD',
                        
                        // Colores Complementarios
                        'navy-light': '#0A4A63',
                        'gold-dark': '#9DAE5C',
                        'teal-light': '#4A92A0',
                        'sand-light': '#F0EEEA',
                        'sand-dark': '#D9D5CF',
                        
                        // Legacy colors (deprecated)
                        'deep-blue': '#00253F',
                        'teal-dark': '#005872',
                        'vivid-turquoise': '#00B4A0',
                        'teal-500': '#14919B',
                        'teal-400': '#0AD1C8',
                        'mint': '#80ED99',
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
                                DEFAULT: 'hsl(var(--primary))',
                                foreground: 'hsl(var(--primary-foreground))'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary))',
                                foreground: 'hsl(var(--secondary-foreground))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        }
                },
                backgroundImage: {
                        'gradient-primary': 'var(--gradient-primary)',
                        'gradient-secondary': 'var(--gradient-secondary)',
                        'gradient-tertiary': 'var(--gradient-tertiary)',
                        'gradient-background': 'var(--gradient-background)',
                        'gradient-subtle': 'var(--gradient-subtle)',
                },
                boxShadow: {
                        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        'elegant': '0 10px 30px -5px rgba(8, 58, 79, 0.15)',
                },
                transitionDuration: {
                        '150': '150ms',
                        '200': '200ms',
                        '300': '300ms',
                        '500': '500ms',
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
