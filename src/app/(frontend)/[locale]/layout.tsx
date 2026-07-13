import type React from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'

import { array, khand, geistSans, geistMono } from '@/fonts'
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
      className={`${array.variable} ${khand.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="font-sans">
        <NextIntlClientProvider>
          <MotionProvider>
            <SiteHeader locale={locale} />
            {children}
            <SiteFooter locale={locale} />
          </MotionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
