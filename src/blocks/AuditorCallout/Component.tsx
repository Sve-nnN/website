import { getTranslations } from 'next-intl/server'

import type { AuditorCalloutBlock as AuditorCalloutBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'
import { StackHighlightCallout } from '@/components/StackHighlightCallout'
import { AUDITOR_URL } from '@/lib/auditor'

/**
 * Server Component (no directiva de cliente en la cabecera de este archivo).
 * Envuelve el `StackHighlightCallout` ya generalizado para dar de alta la
 * segunda superficie de enlace al auditor (FEAT-03), inmediatamente despues
 * de `ServiceScopeCard` en la landing "Auditoría SEO Técnica".
 *
 * NO pasa el prop `badge` — ese chip existe especificamente para marcar el
 * "no-commission pick" dentro de la taxonomia de afiliados de `/stack`;
 * usarlo aca implicaria falsamente que este callout pertenece a esa
 * taxonomia, cuando es producto propio de Juan (CONTEXT.md/FEAT-04).
 */
export async function AuditorCalloutComponent(props: AuditorCalloutBlockProps) {
  const { heading, narrative } = props
  const t = await getTranslations('auditorCallout')

  return (
    <Container className="py-12">
      <StackHighlightCallout
        heading={heading || t('heading')}
        narrative={narrative}
        linkHref={AUDITOR_URL}
        linkLabel={t('cta')}
        linkOpensInNewTabLabel={t('opensInNewTab')}
      />
    </Container>
  )
}
