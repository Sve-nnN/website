import localFont from 'next/font/local'
import { Khand } from 'next/font/google'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

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

export const geistSans = GeistSans
export const geistMono = GeistMono
