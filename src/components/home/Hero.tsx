'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef } from 'react'

import { GrainBlob } from '@/components/mui/GrainBlob'
import { linkFor } from '@/components/mui/links'
import type { HomeHero } from '@/lib/home-data'
import { useMotion } from '@/theme/motion'

import { ASCII_GRID } from './ascii-grid'

const GRID = ASCII_GRID.split('|')
const GC = GRID[0].length
const GR = GRID.length
const RAMP = '.:-=+*#%@@'
// El sitio es solo oscuro: el retrato usa siempre la tinta clara.
const INK = '250,250,247'

/**
 * Retrato ASCII en canvas. Con `useMotion().paused` se dibuja estatico y no
 * registra la revelacion por puntero (el estado vive en `html[data-motion]`).
 * El retrato es un activo de diseno estatico, no un dato del CMS.
 */
function AsciiPortrait({ label }: { label: string }) {
  const { paused } = useMotion()
  const cv = useRef<HTMLCanvasElement>(null)
  const st = useRef({ px: -999, py: -999, k: 0, target: 0, raf: 0, w: 0, h: 0 })

  const draw = useCallback(() => {
    const c = cv.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const s = st.current
    ctx.clearRect(0, 0, s.w, s.h)
    const cw = s.w / GC
    const ch = s.h / GR
    const R = 110 * s.k
    ctx.font = `600 ${(ch * 0.98).toFixed(1)}px "Geist Mono", ui-monospace, Menlo, monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (let y = 0; y < GR; y++) {
      for (let x = 0; x < GC; x++) {
        const c0 = GRID[y][x]
        if (c0 === 'x') continue
        const v = 9 - +c0
        const a = 0.3 + v * 0.08
        const cx = (x + 0.5) * cw
        const cy = (y + 0.5) * ch
        let hot = false
        let f = 0
        if (R > 1) {
          const d = Math.hypot(cx - s.px, cy - s.py)
          if (d < R) {
            hot = true
            f = 1 - d / R
          }
        }
        ctx.fillStyle = hot
          ? `rgba(255,246,236,${(0.6 + f * 0.4).toFixed(3)})`
          : `rgba(${INK},${a.toFixed(3)})`
        ctx.fillText(RAMP[v], cx, cy)
      }
    }
  }, [])

  const size = useCallback(() => {
    const c = cv.current
    if (!c) return
    const r = c.getBoundingClientRect()
    const d = Math.min(window.devicePixelRatio || 1, 2)
    const s = st.current
    s.w = r.width
    s.h = r.height
    c.width = r.width * d
    c.height = r.height * d
    c.getContext('2d')?.setTransform(d, 0, 0, d, 0, 0)
    draw()
  }, [draw])

  useEffect(() => {
    size()
    const on = () => size()
    window.addEventListener('resize', on)
    document.fonts?.ready.then(draw)
    const s = st.current
    return () => {
      window.removeEventListener('resize', on)
      if (s.raf) cancelAnimationFrame(s.raf)
      s.raf = 0
    }
  }, [size, draw])

  // Al pausar el movimiento se apaga cualquier revelacion en curso y se redibuja estatico.
  useEffect(() => {
    if (!paused) return
    const s = st.current
    if (s.raf) cancelAnimationFrame(s.raf)
    s.raf = 0
    s.k = 0
    s.target = 0
    draw()
  }, [paused, draw])

  const tick = () => {
    const s = st.current
    s.k += (s.target - s.k) * 0.16
    if (Math.abs(s.target - s.k) < 0.01) s.k = s.target
    draw()
    s.raf = s.k !== s.target ? requestAnimationFrame(tick) : 0
  }
  const kick = () => {
    if (!st.current.raf) st.current.raf = requestAnimationFrame(tick)
  }

  return (
    <Box
      onPointerMove={
        paused
          ? undefined
          : (e) => {
              const r = e.currentTarget.getBoundingClientRect()
              st.current.px = e.clientX - r.left
              st.current.py = e.clientY - r.top
              st.current.target = 1
              kick()
            }
      }
      onPointerLeave={
        paused
          ? undefined
          : () => {
              st.current.target = 0
              kick()
            }
      }
      sx={{
        position: 'absolute',
        left: '13%',
        right: '13%',
        bottom: '3%',
        aspectRatio: '1010 / 1147',
        maskImage: 'linear-gradient(#000 74%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(#000 74%, transparent 100%)',
      }}
    >
      <canvas ref={cv} role="img" aria-label={label} style={{ width: '100%', height: '100%', display: 'block' }} />
    </Box>
  )
}

/**
 * Hero de la home. El h1 son dos lineas, cada una un span en bloque (sin br):
 * el lector de pantalla las lee juntas y el corte visual no depende de
 * markup. Los textos llegan por props desde el global `home-page`.
 */
export function Hero({ hero }: { hero: HomeHero }) {
  const t = useTranslations('home')
  const cta = hero.ctaLabel && hero.ctaHref ? { label: hero.ctaLabel, href: hero.ctaHref } : null

  return (
    <Box component="section" id="inicio" aria-labelledby="home-title" sx={{ pt: { xs: 16, md: 20 }, pb: { xs: 8, md: 12 } }}>
      <Container
        maxWidth="lg"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,1.1fr) minmax(0,0.9fr)' },
          gap: { xs: 6, md: 8 },
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'grid', gap: 3, justifyItems: 'start' }}>
          {hero.eyebrow && (
            <Typography variant="overline" sx={{ color: 'accentText', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box aria-hidden="true" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
              {hero.eyebrow}
            </Typography>
          )}
          <Typography id="home-title" variant="h1" component="h1">
            <Box component="span" sx={{ display: 'block' }}>
              {hero.titleLine1}
            </Box>
            {hero.titleLine2 && (
              <Box component="span" sx={{ display: 'block' }}>
                {hero.titleLine2}
              </Box>
            )}
          </Typography>
          {hero.lead && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: '1.125rem', lineHeight: '1.75rem', maxWidth: 520 }}
            >
              {hero.lead}
            </Typography>
          )}
          {cta && (
            <Button
              component={linkFor(cta.href)}
              href={cta.href}
              variant="contained"
              size="large"
              endIcon={<ArrowRight size={20} aria-hidden="true" />}
            >
              {cta.label}
            </Button>
          )}
        </Box>
        <Box>
          <Box sx={{ position: 'relative', width: '100%', maxWidth: 480, aspectRatio: '1', mx: 'auto' }}>
            <GrainBlob feather={18} sx={{ inset: 0 }} />
            <AsciiPortrait label={t('heroPortraitLabel')} />
            {hero.statValue && (
              <Box
                sx={{
                  position: 'absolute',
                  left: 8,
                  right: 8,
                  bottom: 8,
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'color-mix(in srgb, var(--jt-palette-background-default) 72%, transparent)',
                  backdropFilter: 'blur(16px)',
                  border: 1,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="h4" component="p" sx={{ color: 'accentText' }}>
                  {hero.statValue}
                </Typography>
                {hero.statCaption && (
                  <Typography variant="caption" color="text.primary">
                    {hero.statCaption}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
