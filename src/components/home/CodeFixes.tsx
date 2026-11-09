'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { ArrowUpRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { UL } from '@/components/mui/lists'
import { visuallyHidden } from '@/components/mui/ScoreRing'
import { Section } from '@/components/mui/Section'
import type { HomeCodeFixes } from '@/lib/home-data-b'

/**
 * Errores reales de este repositorio publico con el commit que los corrige.
 * Cada tarjeta lleva el sintoma (h3), la causa, el codigo y el commit. El
 * codigo es texto plano dentro de una region desplazable con nombre y foco por
 * teclado (SC 2.1.1), sin resaltado de sintaxis y sin ejecutarse jamas: todo
 * valor del CMS entra como hijo de Typography (T-54-57). Los enlaces externos
 * abren en pestana nueva con su sufijo para lector de pantalla (T-54-58).
 * Sin arreglos no se renderiza.
 */
export function CodeFixes({ block }: { block: HomeCodeFixes }) {
  const t = useTranslations('home')
  const tc = useTranslations('common')
  if (block.fixes.length === 0) return null

  const newTab = (
    <Box component="span" sx={visuallyHidden}>
      {` (${tc('opensInNewTab')})`}
    </Box>
  )

  return (
    <Section id="codigo" py title={block.title} lead={block.intro ?? undefined}>
      {block.repoUrl && (
        <Box sx={{ mt: -3, mb: 4 }}>
          <Link
            href={block.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}
          >
            <Typography variant="mono" component="span" sx={{ fontSize: '0.875rem', color: 'inherit' }}>
              {block.repoLabel ?? block.repoUrl.replace(/^https?:\/\/(www\.)?/, '')}
            </Typography>
            <ArrowUpRight size={16} aria-hidden="true" />
            {newTab}
          </Link>
        </Box>
      )}
      <UL
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'repeat(3, minmax(0,1fr))' },
          gap: 2,
        }}
      >
        {block.fixes.map((fix, i) => (
          <Card key={`${i}-${fix.filePath}`} component="li" sx={{ p: 3, display: 'grid', gap: 2, alignContent: 'start', minWidth: 0 }}>
            <Chip
              label={fix.filePath}
              size="small"
              sx={{ justifySelf: 'start', maxWidth: '100%' }}
            />
            <Typography variant="h6" component="h3">
              {fix.symptom}
            </Typography>
            {fix.cause && (
              <Typography variant="body2" color="text.secondary">
                {fix.cause}
              </Typography>
            )}
            <Box
              role="region"
              tabIndex={0}
              aria-label={t('codeFixes.regionLabel', { name: fix.symptom })}
              sx={{
                bgcolor: 'raised',
                borderRadius: '8px',
                p: 2,
                overflowX: 'auto',
                '&:focus-visible': { outline: '2px solid var(--jt-palette-accentText)', outlineOffset: '2px' },
              }}
            >
              <Typography variant="mono" component="pre" sx={{ m: 0, color: 'text.primary', whiteSpace: 'pre' }}>
                <code>{fix.code}</code>
              </Typography>
            </Box>
            {fix.outcome && (
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'accentText' }}>
                {fix.outcome}
              </Typography>
            )}
            {fix.commitUrl && (
              <Chip
                component="a"
                href={fix.commitUrl}
                target="_blank"
                rel="noopener noreferrer"
                clickable
                size="small"
                sx={{ justifySelf: 'start' }}
                label={
                  <>
                    {fix.commitSha ?? 'commit'}
                    {newTab}
                  </>
                }
                icon={<ArrowUpRight size={14} aria-hidden="true" />}
              />
            )}
          </Card>
        ))}
      </UL>
    </Section>
  )
}
