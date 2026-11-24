'use client'

import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

import { linkFor } from '@/components/mui/links'
import { UL } from '@/components/mui/lists'
import type { PostAuthorProps } from '@/lib/blog-data'

/**
 * Bloque de autoria del post (E-E-A-T, CONT-02): foto, nombre, cargo, bio,
 * credenciales y anos de experiencia, con un enlace explicito al perfil. Es un
 * `aside` nombrado por su h2 (`post-author-t`, id reservado en lexical-toc).
 * Cada dato opcional se pinta solo si existe; nunca se omite el bloque entero
 * porque falte uno. El avatar es decorativo: el nombre ya esta como texto.
 */
export function PostAuthorAside({ author }: { author: PostAuthorProps }) {
  const t = useTranslations('post.author')

  return (
    <Card
      component="aside"
      aria-labelledby="post-author-t"
      sx={{
        mt: 8,
        p: { xs: 3, md: 4 },
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: author.avatar ? 'auto minmax(0,1fr)' : 'minmax(0,1fr)' },
        gap: 3,
        alignItems: 'start',
        bgcolor: 'raised',
      }}
    >
      {author.avatar && <Avatar src={author.avatar.url} alt="" sx={{ width: 80, height: 80 }} />}
      <Box sx={{ display: 'grid', gap: 1.5, minWidth: 0 }}>
        <Typography id="post-author-t" variant="overline" component="h2" sx={{ color: 'accentText' }}>
          {t('title')}
        </Typography>
        <Box>
          <Typography variant="h6" component="p">
            {author.name}
          </Typography>
          {author.jobTitle && (
            <Typography variant="body2" color="text.secondary">
              {author.jobTitle}
            </Typography>
          )}
        </Box>
        {author.bio && <Typography variant="body1">{author.bio}</Typography>}
        {author.credentials.length > 0 && (
          <UL aria-label={t('credentialsLabel')} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {author.credentials.map((label) => (
              <Box
                key={label}
                component="li"
                sx={{ px: 1.5, py: 0.5, borderRadius: 9999, border: 1, borderColor: 'divider', typography: 'body2' }}
              >
                {label}
              </Box>
            ))}
          </UL>
        )}
        {author.yearsExperience !== null && (
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {t('years', { years: author.yearsExperience })}
          </Typography>
        )}
        <Link
          component={linkFor(author.href)}
          href={author.href}
          underline="always"
          sx={{ display: 'inline-flex', alignItems: 'center', minHeight: 40, fontWeight: 600, color: 'accentText' }}
        >
          {t('profile', { name: author.name })}
        </Link>
      </Box>
    </Card>
  )
}
