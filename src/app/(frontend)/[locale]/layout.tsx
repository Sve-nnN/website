import type React from 'react'
import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { array, khand, geistSans } from '@/fonts'
import { routing } from '@/i18n/routing'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { MotionProvider } from '@/components/MotionProvider'
import { SITE_URL } from '@/lib/sitemap-data'
import '../../globals.css'

// This file has no src/app/layout.tsx above it — it IS the root of the
// public frontend tree, so the base URL for resolving relative metadata
// (OG images, canonicals) is set here exactly once, sitewide.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // og:image-derived twitter:image is inherited automatically per Next's
  // Metadata API — no separate twitter.images/twitter.creator declared here.
  // twitter.creator omitted: Juan confirmed no Twitter/X account (41-CONTEXT.md).
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

// themeColor lives on the dedicated `viewport` export, NOT inside `metadata`
// — Next.js 15 requires this split; putting themeColor under `metadata`
// silently does nothing.
export const viewport: Viewport = {
  themeColor: '#F7581E',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  setRequestLocale(locale)

  return (
    <html
      lang={locale}
      className={`${array.variable} ${khand.variable} ${geistSans.variable}`}
    >
      <body className="font-sans">
        <NextIntlClientProvider>
          <MotionProvider>
            {/* POLISH: there was no bypass mechanism — measured 8 tab stops
                between page load and the first focusable element inside the
                content, repeated on every page. That is WCAG 2.4.1 (Bypass
                Blocks), a level A criterion. The link is off-screen until it
                takes focus, then lands as a normal ember button. */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:inline-flex focus:h-10 focus:items-center focus:rounded-md focus:bg-primary focus:px-4 focus:text-label focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {locale === 'en' ? 'Skip to content' : 'Saltar al contenido'}
            </a>
            <SiteHeader locale={locale} />
            <div id="main-content" tabIndex={-1}>
              {children}
            </div>
            <SiteFooter locale={locale} />
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
