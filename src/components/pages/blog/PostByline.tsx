'use client'

import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { CalendarDays, Clock } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { formatLongDateUtc } from '@/components/mui/format-date'
import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import type { PostAuthorProps, PostCategoryChip } from '@/lib/blog-data'

type Props = {
  author: PostAuthorProps | null
  dateISO: string | null
  readingMinutes: number
  categories: PostCategoryChip[]
}

/**
 * Firma del post dentro del PageHero: autor con enlace a su perfil (E-E-A-T),
 * fecha en `time`, tiempo de lectura y las categorias como enlaces reales.
 * Todas las props son serializables; el enlace se resuelve aqui con `linkFor`
 * (Pitfall 17). El avatar es decorativo: el nombre ya esta como texto al lado.
 */
export function PostByline({ author, dateISO, readingMinutes, categories }: Props) {
  const t = useTranslations('post')
  const locale = useLocale()
  const date = formatLongDateUtc(dateISO, locale)

  return (
    <Box sx={{ display: 'grid', gap: 2, justifyItems: 'start' }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          columnGap: { xs: 2, md: 3 },
          rowGap: 1.5,
          color: 'text.secondary',
        }}
      >
        {author && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            {author.avatar && <Avatar src={author.avatar.url} alt="" sx={{ width: 44, height: 44 }} />}
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" component="p" sx={{ color: 'text.primary', fontWeight: 600 }}>
                <Link component={linkFor(author.href)} href={author.href} underline="hover" sx={{ color: 'inherit' }}>
                  {author.name}
                </Link>
              </Typography>
              {author.jobTitle && (
                <Typography variant="caption" component="p">
                  {author.jobTitle}
                </Typography>
              )}
            </Box>
          </Box>
        )}
        {date && dateISO && (
          <Typography variant="body2" component="p" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
            <CalendarDays size={16} aria-hidden="true" />
            <time dateTime={dateISO}>{date}</time>
          </Typography>
        )}
        <Typography variant="body2" component="p" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
          <Clock size={16} aria-hidden="true" />
          {t('readingTime', { minutes: readingMinutes })}
        </Typography>
      </Box>

      {categories.length > 0 && (
        <UL aria-label={t('categoriesLabel')} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                component={linkFor(c.href)}
                href={c.href}
                underline="none"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  minHeight: 40,
                  px: 2,
                  borderRadius: 9999,
                  border: 1,
                  borderColor: 'fieldBorder',
                  color: 'text.primary',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  lineHeight: '1.25rem',
                  transition: 'background-color 200ms',
                  '&:hover': { bgcolor: 'raised' },
                  '&:focus-visible': { outline: '2px solid var(--jt-palette-accentText)', outlineOffset: 2 },
                }}
              >
                {c.title}
              </Link>
            </li>
          ))}
        </UL>
      )}
    </Box>
  )
}
