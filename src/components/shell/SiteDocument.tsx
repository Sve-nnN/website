import type React from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getTranslations } from 'next-intl/server'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

import { array, khand, geistSans } from '@/fonts'
import { SiteHeader } from '@/components/shell/SiteHeader'
import { SiteFooter } from '@/components/shell/SiteFooter'
import { SkipLink } from '@/components/shell/SkipLink'
import { MotionToggle } from '@/components/shell/MotionToggle'
import { MotionProvider } from '@/components/MotionProvider'
import { Providers } from '@/theme/Providers'
import { MOTION_INIT_SCRIPT } from '@/theme/motion-init'

/**
 * Documento completo del sitio: html, head, body, proveedores, header, main y
 * footer. Lo comparten dos entradas que Next trata como raíces distintas:
 *
 *   - `[locale]/layout.tsx`, para toda ruta que existe.
 *   - `global-not-found.tsx`, para una URL que no coincide con ninguna ruta.
 *
 * Next 15.4 solo renderiza en el servidor (con el shell dentro del HTML) la
 * 404 de una URL sin ruta. Un `notFound()` lanzado desde una página produce un
 * documento de error vacío que el cliente rehace (medido con
 * scripts/verify/54-notfound-status.mjs). Por eso la 404 de URLs sin ruta pasa
 * por `global-not-found` y necesita este mismo documento: mantenerlo en un solo
 * archivo evita que las dos raíces se separen.
 */
export async function SiteDocument({
  locale,
  children,
}: {
  locale: 'es' | 'en'
  children: React.ReactNode
}) {
  const t = await getTranslations({ locale, namespace: 'shell' })

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${array.variable} ${khand.variable} ${geistSans.variable}`}
    >
      <head>
        {/* Estado inicial de movimiento (D-15). Cadena constante, sin datos de
            usuario (T-53-41). Corre en el head, antes del primer pintado, para
            que data-motion no parpadee tras hidratar. */}
        <script dangerouslySetInnerHTML={{ __html: MOTION_INIT_SCRIPT }} />
      </head>
      <body>
        <InitColorSchemeScript attribute="data" defaultMode="dark" />
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <Providers>
            <NextIntlClientProvider>
              <MotionProvider>
                <SkipLink />
                <SiteHeader locale={locale} />
                {/* El documento posee el único landmark main (D-13). Las páginas
                    renderizan div: dos main anidados rompen la navegación por
                    landmarks. tabIndex -1 permite que el enlace de salto
                    deje el foco aquí. */}
                <main id="main-content" tabIndex={-1} aria-label={t('landmarks.main')} style={{ outline: 'none' }}>
                  {children}
                </main>
                <SiteFooter locale={locale} />
                <MotionToggle />
              </MotionProvider>
            </NextIntlClientProvider>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
