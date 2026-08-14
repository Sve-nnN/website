import localFont from 'next/font/local'
import { Khand, Geist } from 'next/font/google'

export const array = localFont({
  src: [
    {
      path: './fonts/Array-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-array',
  display: 'swap',
  fallback: ['Arial Narrow', 'system-ui', 'sans-serif'],
})

export const khand = Khand({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-khand',
  display: 'swap',
  fallback: ['Arial Narrow', 'system-ui', 'sans-serif'],
})

// Geist used to come from the `geist` npm package, which ships one prebuilt
// next/font instance per family with no options to pass. That cost twice over:
// the files carry cyrillic + latin-ext alongside latin (69.6 KB for Sans,
// 71.3 KB for Mono, neither with a `unicode-range`), and both were preloaded on
// every route. Seven woff2 files totalling 188.4 KB sat in the `Link` preload
// header of every page.
//
// Loading them through `next/font/google` instead makes both knobs reachable.
// Khand, declared right above, was always the well-behaved one — four weights
// at ~7.7 KB each, properly subset. This brings Geist in line with it.
//
// Sans stays preloaded: Lighthouse identifies the LCP element on the home page
// as `<p class="text-body ...">`, which resolves to `font-sans`, so this is the
// font the largest paint is actually waiting on.
export const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

// There is deliberately no monospace webfont here.
//
// GeistMono was 71.3 KB with no unicode-range, preloaded on every route
// including the ones without a single line of code. The first instinct was to
// drop the preload and keep the file; the better answer is not to ship one at
// all. `theme.fontFamily.mono` in tailwind.config.ts now names the platform
// monospace stack — SF Mono on macOS, Consolas on Windows, DejaVu Sans Mono on
// Linux — which costs zero bytes and is already resident. GitHub, Stack
// Overflow and MDN all render code the same way.
//
// The tradeoff is that a code block does not look byte-identical across
// operating systems. Inside a `<pre>`, on a blog read by developers, that is
// not a cost worth 71.3 KB on the critical path.
