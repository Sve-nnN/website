import { useTranslations } from 'next-intl'
import type { CSSProperties } from 'react'

import { CtaSection } from '@/components/mui/CtaSection'
import { LogoMarquee } from '@/components/mui/LogoMarquee'
import { TranslationNotice } from '@/components/mui/TranslationNotice'
import type { Locale } from '@/lib/cache'
import type { HomeData } from '@/lib/home-data'

import { About } from './About'
import { AuditOffer } from './AuditOffer'
import { AuditorHighlightCard } from './AuditorHighlightCard'
import { Cases } from './Cases'
import { CodeFixes } from './CodeFixes'
import { Faq } from './Faq'
import { Hero } from './Hero'
import { Process } from './Process'
import { Services } from './Services'
import { Sites } from './Sites'
import { Tagline } from './Tagline'
import { Testimonials } from './Testimonials'
import { Vitals } from './Vitals'

// Estilo local y no `visuallyHidden` de ScoreRing: ese modulo es 'use client' y
// desde un Server Component su export llegaria como referencia de cliente, no
// como el objeto de estilo.
const HIDDEN: CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
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
 * Orden aprobado: Hero, marquesina, Tagline, Vitals, errores reales, Servicios,
 * Casos, Auditor, Proceso, Sitios, Sobre mi, Testimonios, oferta de auditoria,
 * FAQ y cierre.
 *
 * En EN, cuando el global no trae el texto traducido (`isFallback`), las
 * secciones que salen de `home-page` van en un contenedor `lang="es"` y se
 * muestra TranslationNotice con el enlace a la version en espanol. Los bloques
 * del doc `home` (errores reales, auditor, oferta) tienen su propio idioma y
 * el cierre decide el suyo con `cta.isFallback`.
 */
export function HomeView({ data, locale, fallbackTitle }: Props) {
  const t = useTranslations('home')
  const showNotice = locale === 'en' && data.isFallback
  // Las secciones que salen de `home-page` van en espanol cuando EN no tiene
  // traduccion. La marquesina sale del doc `home` y de `clientes`, no del global.
  const copyLang = showNotice ? 'es' : undefined
  const b = data.sectionsB

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
      {data.vitals && <div lang={copyLang}><Vitals vitals={data.vitals} /></div>}
      {b.codeFixes && <CodeFixes block={b.codeFixes} />}
      {data.services && <div lang={copyLang}><Services services={data.services} locale={locale} /></div>}
      {b.cases && <div lang={copyLang}><Cases cases={b.cases} /></div>}
      {b.auditor && <AuditorHighlightCard auditor={b.auditor} />}
      {b.process && <div lang={copyLang}><Process process={b.process} /></div>}
      {b.sites && <div lang={copyLang}><Sites sites={b.sites} /></div>}
      {b.about && <div lang={copyLang}><About about={b.about} /></div>}
      {b.testimonials && <div lang={copyLang}><Testimonials testimonials={b.testimonials} /></div>}
      {b.auditOffer && <AuditOffer offer={b.auditOffer} />}
      {b.faq && <div lang={copyLang}><Faq faq={b.faq} /></div>}
      {b.cta && (
        <div lang={b.cta.isFallback && locale === 'en' ? 'es' : undefined}>
          <CtaSection
            title={b.cta.title}
            lead={b.cta.lead}
            email={b.cta.email}
            name={b.cta.name}
            avatarUrl={b.cta.avatarUrl}
          />
        </div>
      )}
    </>
  )
}
