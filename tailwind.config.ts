import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    // Pre-existing gap found in 10.8 while verifying the Hero block's new
    // breadcrumb nav didn't cause mobile overflow: `src/blocks/**` was never
    // in this content glob, so any Tailwind utility used ONLY inside a block
    // (and nowhere under src/components|app) was silently purged — e.g.
    // ArchiveBlock's `overflow-x-auto` on its category-filter tabs never
    // actually compiled, letting the tabs overflow the viewport at 375px.
    './src/blocks/**/*.{ts,tsx}',
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-geist-sans)'],
  			display: ['var(--font-array)'],
  			heading: ['var(--font-khand)'],
  			mono: ['var(--font-geist-mono)']
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
  			//
  			// EVERY colour MUST be `rgb(var(--token) / <alpha-value>)`, never a
  			// bare `var(--token)`. Tailwind v3 can only synthesise an opacity
  			// variant (`bg-primary/90`, `text-secondary-foreground/70`, ...) when
  			// the colour is a function carrying the `<alpha-value>` placeholder;
  			// against a bare var() it silently emits NO CSS AT ALL for that
  			// utility. That is what these tokens used to be, which killed 29
  			// slash-opacity utilities across 14 files — including every button
  			// hover state — with no build error and no visible clue in the
  			// markup. The matching contract lives in src/app/globals.css: the
  			// tokens there are space-separated sRGB channels ("247 88 30"), not
  			// hex/oklch/rgba literals. Change one side and you must change both.
  			background: 'rgb(var(--background) / <alpha-value>)',
  			foreground: 'rgb(var(--foreground) / <alpha-value>)',
  			card: {
  				DEFAULT: 'rgb(var(--card) / <alpha-value>)',
  				foreground: 'rgb(var(--card-foreground) / <alpha-value>)'
  			},
  			popover: {
  				DEFAULT: 'rgb(var(--popover) / <alpha-value>)',
  				foreground: 'rgb(var(--popover-foreground) / <alpha-value>)'
  			},
  			primary: {
  				DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
  				foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
  				// Phase 25 gap-closure: AA-safe emphasis-text variant of primary for
  				// use as a text color on light surfaces (see globals.css comment).
  				text: 'rgb(var(--primary-text) / <alpha-value>)'
  			},
  			secondary: {
  				DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
  				foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)'
  			},
  			muted: {
  				DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
  				foreground: 'rgb(var(--muted-foreground) / <alpha-value>)'
  			},
  			accent: {
  				DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
  				foreground: 'rgb(var(--accent-foreground) / <alpha-value>)'
  			},
  			destructive: 'rgb(var(--destructive) / <alpha-value>)',
  			border: 'rgb(var(--border) / <alpha-value>)',
  			input: 'rgb(var(--input) / <alpha-value>)',
  			ring: 'rgb(var(--ring) / <alpha-value>)',
  			chart: {
  				'1': 'rgb(var(--chart-1) / <alpha-value>)',
  				'2': 'rgb(var(--chart-2) / <alpha-value>)',
  				'3': 'rgb(var(--chart-3) / <alpha-value>)',
  				'4': 'rgb(var(--chart-4) / <alpha-value>)',
  				'5': 'rgb(var(--chart-5) / <alpha-value>)'
  			},
  			sidebar: {
  				DEFAULT: 'rgb(var(--sidebar) / <alpha-value>)',
  				foreground: 'rgb(var(--sidebar-foreground) / <alpha-value>)',
  				primary: 'rgb(var(--sidebar-primary) / <alpha-value>)',
  				'primary-foreground': 'rgb(var(--sidebar-primary-foreground) / <alpha-value>)',
  				accent: 'rgb(var(--sidebar-accent) / <alpha-value>)',
  				'accent-foreground': 'rgb(var(--sidebar-accent-foreground) / <alpha-value>)',
  				border: 'rgb(var(--sidebar-border) / <alpha-value>)',
  				ring: 'rgb(var(--sidebar-ring) / <alpha-value>)'
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
