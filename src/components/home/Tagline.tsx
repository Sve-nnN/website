'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'
import { useEffect, useRef } from 'react'

import { visuallyHidden } from '@/components/mui/ScoreRing'
import { useMotion } from '@/theme/motion'
import { motion } from '@/theme/tokens'

/**
 * Frase que se enciende palabra por palabra al hacer scroll.
 *
 * La frase completa va en un span visualmente oculto (la lee el lector de
 * pantalla de corrido) y las palabras sueltas en un span `aria-hidden`.
 * Con `useMotion().paused`, o sin IntersectionObserver, aparece completa de
 * inmediato: el estado de movimiento vive en `html[data-motion]`.
 */
export function Tagline({ text }: { text: string }) {
  const t = useTranslations('home')
  const { paused } = useMotion()
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const words = Array.from(ref.current?.querySelectorAll<HTMLElement>('[data-w]') ?? [])
    const lightAll = () => words.forEach((w) => (w.dataset.on = '1'))
    if (paused || typeof IntersectionObserver === 'undefined') {
      lightAll()
      return
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).dataset.on = '1'
            io.unobserve(e.target)
          }
        }),
      { rootMargin: '0px 0px -40% 0px' },
    )
    words.forEach((w) => io.observe(w))
    return () => io.disconnect()
  }, [paused, text])

  return (
    <Box component="section" aria-label={t('taglineLabel')} sx={{ py: { xs: 10, md: 16 } }}>
      <Container maxWidth="lg">
        <Typography variant="h2" component="p" sx={{ maxWidth: 880 }}>
          <Box component="span" sx={visuallyHidden}>
            {text}
          </Box>
          <Box component="span" ref={ref} aria-hidden="true">
            {text.split(/\s+/).map((w, i) => (
              <Box
                key={`${i}-${w}`}
                component="span"
                data-w
                sx={{
                  color: 'text.secondary',
                  transition: `color var(--jt-motion-slow, ${motion.slow}ms) ${motion.ease}`,
                  '&[data-on]': { color: 'text.primary' },
                }}
              >
                {w}{' '}
              </Box>
            ))}
          </Box>
        </Typography>
      </Container>
    </Box>
  )
}
