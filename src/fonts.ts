import localFont from 'next/font/local'
import { Khand, Geist, Geist_Mono } from 'next/font/google'

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

// Mono is NOT preloaded. It is real — Tailwind's preflight maps
// `code, kbd, pre, samp` to `--font-geist-mono`, and the cs-fundamentals posts
// do carry code blocks (big-o-notation alone has 6 `<pre>` and 12 `<code>`), so
// deleting it would break their typography. But it is worth nothing on the home
// page, the services pages or the case studies, which contain no code at all,
// and its 71.3 KB were competing for bandwidth against the font the LCP waits
// on. Without preload it still downloads via @font-face wherever a code block
// exists, just without a high-priority hint on the pages that never need it.
export const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: false,
})
