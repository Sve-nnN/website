import { useTranslations } from 'next-intl'
import type { CSSProperties } from 'react'

import { LogoMarquee } from '@/components/mui/LogoMarquee'
import { TranslationNotice } from '@/components/mui/TranslationNotice'
import type { Locale } from '@/lib/cache'
import type { HomeData } from '@/lib/home-data'

import { Hero } from './Hero'
import { Tagline } from './Tagline'

// Estilo local y no `visuallyHidden` de ScoreRing: ese modulo es 'use client' y
// desde un Server Component su export llegaria como referencia de cliente, no
// como el objeto de estilo.
const HIDDEN: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

type Props = {
  data: HomeData
  locale: Locale
  /** Titulo del doc `home` de pages: h1 de respaldo si el global no trae hero. */
  fallbackTitle: string
}

/**
 * Composicion de la home. Server Component: compone secciones cliente y solo
 * renderiza las que tienen datos. No declara landmark principal (lo pone el
 * layout del sitio). Siempre hay un h1: el del hero o, sin hero, uno
 * visualmente oculto con el titulo del doc.
 *
 * En EN, cuando el global no trae el texto traducido (`isFallback`), las
 * secciones que salen de `home-page` van en un contenedor `lang="es"` y se
 * muestra TranslationNotice con el enlace a la version en espanol.
 */
export function HomeView({ data, locale, fallbackTitle }: Props) {
  const t = useTranslations('home')
  const showNotice = locale === 'en' && data.isFallback
  // Las secciones que salen de `home-page` van en espanol cuando EN no tiene
  // traduccion. La marquesina sale del doc `home` y de `clientes`, no del global.
  const copyLang = showNotice ? 'es' : undefined

  return (
    <>
      {showNotice && <TranslationNotice esHref="/" />}
      {!data.hero && <h1 style={HIDDEN}>{fallbackTitle}</h1>}
      {data.hero && <div lang={copyLang}><Hero hero={data.hero} /></div>}
      {data.clients && (
        <LogoMarquee
          title={data.clients.title}
          groupLabel={t('marquee.groupLabel')}
          logos={data.clients.logos}
        />
      )}
      {data.tagline && <div lang={copyLang}><Tagline text={data.tagline} /></div>}
    </>
  )
}
