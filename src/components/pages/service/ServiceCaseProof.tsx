import Box from '@mui/material/Box'
import { useTranslations } from 'next-intl'

import { CaseMetricCard } from '@/components/mui/CaseMetricCard'
import { Section } from '@/components/mui/Section'
import { formatSector, splitHeroMetric } from '@/components/mui/split-hero-metric'
import type { CaseProof } from '@/lib/service-view-data'

type Props = {
  proof: CaseProof
  /** Titulo del bloque; sin el, `relatedCaseStudyBlock.title` de messages. */
  title?: string | null
  /** Texto de enmarcado honesto del bloque. */
  framingText?: string | null
}

/**
 * Prueba de caso (relatedCaseStudyBlock): h2 del bloque, el texto de
 * enmarcado y una tarjeta de resultado con la cifra, el sector, el titulo y el
 * enlace al caso. La pagina decide si hay caso; sin caso no se monta.
 * Server Component: solo pasa strings a las vistas cliente.
 */
export function ServiceCaseProof({ proof, title, framingText }: Props) {
  const t = useTranslations('relatedCaseStudyBlock')
  const { metric, label } = splitHeroMetric(proof.heroMetric)
  const sector = formatSector(proof.sector)
  return (
    <Section id="prueba" title={title?.trim() || t('title')} lead={framingText?.trim() || undefined} py>
      <Box sx={{ maxWidth: 520 }}>
        <CaseMetricCard
          as="div"
          tone="paper"
          href={`/case-studies/${proof.slug}`}
          tag={sector === '' ? null : sector}
          metric={metric}
          title={proof.title}
          suffix={label}
        />
      </Box>
    </Section>
  )
}
