'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { subscribeAction, type SubscribeState } from '@/app/actions/subscribe'
import type { BlogNewsletterData, NewsletterNotice } from '@/lib/blog-data'

type Props = {
  data: BlogNewsletterData
  /** `?newsletter=` de la URL, ya validado. Con confirmed o unsubscribed reemplaza al formulario. */
  notice: NewsletterNotice | null
}

function SubmitButton({ label, sendingLabel }: { label: string; sendingLabel: string }) {
  // `useFormStatus` solo funciona desde un hijo del <form>.
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="contained" size="large" disabled={pending} sx={{ minHeight: 56 }}>
      {pending ? sendingLabel : label}
    </Button>
  )
}

/**
 * Alta al correo del blog en MUI. Publica a la MISMA accion de servidor que el
 * bloque anterior (`subscribeAction`) con los mismos campos: email, locale,
 * source y el honeypot company_website. En el preview la accion responde exito
 * sin escribir (PREVIEW_READONLY, D-21): esta vista no agrega ninguna escritura.
 *
 * Los textos de la franja (titulo, descripcion, etiquetas y consentimiento) salen
 * del bloque del CMS; las etiquetas por omision y los estados, de messages. Los
 * enlaces del correo vuelven a /blog?newsletter= y el aviso reemplaza al
 * formulario en confirmed y unsubscribed: quien vuelve del correo ya hizo lo que
 * la franja pide.
 */
export function BlogNewsletter({ data, notice }: Props) {
  const t = useTranslations('blog.newsletter')
  const locale = useLocale()
  const pathname = usePathname()
  const [state, formAction] = useActionState<SubscribeState, FormData>(subscribeAction, { status: 'idle' })

  const message =
    state.status === 'success'
      ? t('success')
      : state.status === 'invalid'
        ? t('invalid')
        : state.status === 'unconfigured'
          ? t('unconfigured')
          : state.status === 'error'
            ? t('error')
            : null
  const isError = state.status === 'invalid' || state.status === 'error' || state.status === 'unconfigured'

  const noticeText =
    notice === 'confirmed' ? t('confirmed') : notice === 'unsubscribed' ? t('unsubscribed') : notice === 'invalid' ? t('invalidLink') : null
  const showForm = notice !== 'confirmed' && notice !== 'unsubscribed'

  return (
    <Box component="section" aria-labelledby="blog-newsletter-t" sx={{ bgcolor: 'raised', py: { xs: 8, md: 10 } }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'grid', gap: 2, maxWidth: 680 }}>
          <Typography id="blog-newsletter-t" variant="h3" component="h2">
            {data.title}
          </Typography>
          {data.description && (
            <Typography variant="body1" color="text.secondary">
              {data.description}
            </Typography>
          )}
          {noticeText && (
            <Typography
              role={notice === 'invalid' ? 'alert' : 'status'}
              variant="body1"
              sx={{ color: notice === 'invalid' ? 'text.primary' : 'accentText', fontWeight: 600 }}
            >
              {noticeText}
            </Typography>
          )}
          {showForm && (
            <Box component="form" action={formAction} sx={{ display: 'grid', gap: 2, mt: 1 }}>
              <input type="hidden" name="locale" value={locale} />
              <input type="hidden" name="source" value={pathname ?? ''} />
              {/* Honeypot fuera de pantalla: lo llenan los bots que completan todos los campos. */}
              <Box aria-hidden="true" sx={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}>
                <label htmlFor="newsletter_company_website">{t('honeypotLabel')}</label>
                <input type="text" id="newsletter_company_website" name="company_website" tabIndex={-1} autoComplete="off" />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0,1fr)', sm: 'minmax(0,1fr) auto' }, gap: 2, alignItems: 'start' }}>
                <TextField
                  id="newsletter-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  label={data.emailLabel ?? t('emailLabel')}
                  error={isError}
                  fullWidth
                  slotProps={{
                    htmlInput: { inputMode: 'email', 'aria-describedby': message ? 'newsletter-status' : undefined },
                  }}
                />
                <SubmitButton label={data.submitLabel ?? t('submitLabel')} sendingLabel={t('sending')} />
              </Box>
              {data.consentText && (
                <Typography variant="body2" color="text.secondary">
                  {data.consentText}
                </Typography>
              )}
              <Typography
                id="newsletter-status"
                role="status"
                aria-live="polite"
                variant="body2"
                sx={{ color: isError ? 'text.primary' : 'accentText', fontWeight: 600, minHeight: '1.25rem' }}
              >
                {message}
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  )
}
