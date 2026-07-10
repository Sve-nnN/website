import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-sans)'],
  			display: ['var(--font-display)']
  		},
  		fontSize: {
  			// UI-SPEC Typography table — 4 sizes only, each pinned to its line-height.
  			body: ['1rem', { lineHeight: '1.5' }], // md=16px / body
  			label: ['0.875rem', { lineHeight: '1.4', fontWeight: '600' }], // sm=14px / label
  			heading: ['clamp(1.375rem, 1.1rem + 1.2vw, 1.75rem)', { lineHeight: '1.2', fontWeight: '600' }], // clamps 22px -> 28px
  			display: ['clamp(2.25rem, 1.4rem + 4vw, 3.5rem)', { lineHeight: '1.05', fontWeight: '600' }] // clamps 36px -> 56px
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			// Spacing scale (multiples of 4, per 05-UI-SPEC.md Spacing Scale table):
  			// xs=4px(p-1) sm=8px(p-2) md=16px(p-4) lg=24px(p-6) xl=32px(p-8) 2xl=48px(p-12) 3xl=64px(p-16)
  			// Use these Tailwind spacing utilities directly — no separate custom scale needed.
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			card: {
  				DEFAULT: 'var(--card)',
  				foreground: 'var(--card-foreground)'
  			},
  			popover: {
  				DEFAULT: 'var(--popover)',
  				foreground: 'var(--popover-foreground)'
  			},
  			primary: {
  				DEFAULT: 'var(--primary)',
  				foreground: 'var(--primary-foreground)'
  			},
  			secondary: {
  				DEFAULT: 'var(--secondary)',
  				foreground: 'var(--secondary-foreground)'
  			},
  			muted: {
  				DEFAULT: 'var(--muted)',
  				foreground: 'var(--muted-foreground)'
  			},
  			accent: {
  				DEFAULT: 'var(--accent)',
  				foreground: 'var(--accent-foreground)'
  			},
  			destructive: 'var(--destructive)',
  			border: 'var(--border)',
  			input: 'var(--input)',
  			ring: 'var(--ring)',
  			chart: {
  				'1': 'var(--chart-1)',
  				'2': 'var(--chart-2)',
  				'3': 'var(--chart-3)',
  				'4': 'var(--chart-4)',
  				'5': 'var(--chart-5)'
  			},
  			sidebar: {
  				DEFAULT: 'var(--sidebar)',
  				foreground: 'var(--sidebar-foreground)',
  				primary: 'var(--sidebar-primary)',
  				'primary-foreground': 'var(--sidebar-primary-foreground)',
  				accent: 'var(--sidebar-accent)',
  				'accent-foreground': 'var(--sidebar-accent-foreground)',
  				border: 'var(--sidebar-border)',
  				ring: 'var(--sidebar-ring)'
  			}
  		},
  		boxShadow: {
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			focus: 'var(--shadow-focus)'
  		},
  		transitionDuration: {
  			fast: 'var(--motion-fast)',
  			base: 'var(--motion-base)',
  			slow: 'var(--motion-slow)'
  		},
  		transitionTimingFunction: {
  			out: 'var(--ease-out)',
  			standard: 'var(--ease-standard)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
