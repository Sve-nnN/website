'use client'

import Link from '@mui/material/Link'
import { useTranslations } from 'next-intl'

import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import type { BlogNavItem } from '@/lib/blog-data'
import { blogIndexPath } from '@/lib/blog-paths'

type Props = {
  items: BlogNavItem[]
  /** Slug de la categoria activa. Sin slug, la activa es "Todas" (el indice). */
  activeSlug?: string
}

/**
 * Navegacion de categorias del blog: un `nav` con enlaces reales (cada categoria
 * es una pagina con su URL, no un filtro), `aria-current="page"` en la activa y
 * objetivos de 40 px. El nombre de cada categoria viene de Payload (D-22);
 * `general` no entra porque la lista ya llega sin ella.
 *
 * Los hrefs van sin prefijo de idioma: `linkFor` resuelve el prefijo en el
 * cliente, igual que el resto de las vistas.
 */
export function CategoryNav({ items, activeSlug }: Props) {
  const t = useTranslations('blog.nav')
  if (items.length === 0) return null

  const all = { slug: '', title: t('all'), href: blogIndexPath() }
  const entries = [all, ...items]
  const active = activeSlug ?? ''

  return (
    <nav aria-label={t('label')}>
      <UL sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {entries.map((entry) => {
          const on = entry.slug === active
          return (
            <li key={entry.href}>
              <Link
                component={linkFor(entry.href)}
                href={entry.href}
                aria-current={on ? 'page' : undefined}
                underline="none"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 40,
                  px: 2,
                  borderRadius: 9999,
                  border: 1,
                  borderColor: on ? 'text.primary' : 'fieldBorder',
                  bgcolor: on ? 'text.primary' : 'transparent',
                  color: on ? 'background.default' : 'text.primary',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem',
                  transition: 'background-color 200ms',
                  '&:hover': { bgcolor: on ? 'text.primary' : 'raised' },
                  '&:focus-visible': { outline: '2px solid var(--jt-palette-accentText)', outlineOffset: 2 },
                }}
              >
                {entry.title}
              </Link>
            </li>
          )
        })}
      </UL>
    </nav>
  )
}
