import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Link from '@mui/material/Link'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { getLocale, getTranslations } from 'next-intl/server'

// CONSTRAINT DURA (T-48-09, re-afirmada por 49-UI-SPEC.md Component Contract
// Detail): este archivo NUNCA importa el renderer compartido de rich text,
// el frame de disclosure de afiliados, ni el componente de preguntas
// frecuentes (ni nada que transitivamente los importe) — reabriría el hazard
// de TDZ/import circular documentado en el docblock de
// `richTextBlockConverters.tsx` (ese módulo importa este componente, y el
// renderer compartido importa ese módulo). El propio `<verify>` de este plan
// corre un grep literal sobre esos tres nombres en este archivo, así que ni
// siquiera en prosa deben aparecer acá — mismo criterio ya aplicado en
// `secure-download.ts`/`download-token.ts` (49-01-SUMMARY.md).
import { subscribeToLeadMagnetAction } from '@/app/actions/subscribe-lead-magnet'

// Oculto a la vista y visible para el lector de pantalla (mismo objeto que MuiRichText).
const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const

const SUBSCRIBED_STATES = ['pending', 'already', 'error'] as const
type SubscribedState = (typeof SUBSCRIBED_STATES)[number]

function isSubscribedState(value: string | undefined): value is SubscribedState {
  return value !== undefined && (SUBSCRIBED_STATES as readonly string[]).includes(value)
}

/**
 * Card leaf para el bloque Lexical `email-capture` — hermano de
 * `AffiliateInlineCard` (Phase 48) en la misma familia de converters de
 * `richTextBlockConverters.tsx`, pero de anatomía vertical (form), no
 * horizontal (link card). Server Component puro: cero JS de cliente, mismo
 * patrón `<form action={fn}>` que `ContactFormBlockComponent` ya prueba en
 * producción (Phase 5).
 *
 * `subscribedState` llega desde `searchParams.subscribed` de la página del
 * post, vía la factory `buildRichTextConverters` — NUNCA se interpola crudo
 * en JSX (T-49-08): solo decide cuál de 3 strings hardcodeados mostrar.
 */
export async function EmailCaptureCard({
  postPath,
  subscribedState,
}: {
  postPath: string
  subscribedState?: string
}) {
  const locale = (await getLocale()) as 'es' | 'en'
  const t = await getTranslations({ locale, namespace: 'emailCapture' })
  const privacyHref = locale === 'en' ? '/en/privacy' : '/privacy'
  const state = isSubscribedState(subscribedState) ? subscribedState : null

  // Plan 57-07 (D-06): MUI en lugar de utilidades Tailwind. Respaldo del bloque cuando el
  // cuerpo no trae los convertidores de `mui/rich-text/blocks` (el post siempre los trae).
  return (
    <Box sx={{ my: 4, p: 3, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Typography variant="overline" component="p" sx={{ opacity: 0.7 }}>
        {t('eyebrow')}
      </Typography>
      <Typography variant="h6" component="p" sx={{ mt: 0.5 }}>
        {t('heading')}
      </Typography>
      <Typography variant="body1" component="p" sx={{ mt: 1, color: 'text.secondary' }}>
        {t('description')}
      </Typography>

      {state === 'pending' && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" component="p">
            {t('pendingHeading')}
          </Typography>
          <Typography variant="body1" component="p" sx={{ mt: 1 }}>
            {t('pendingBody')}
          </Typography>
        </Box>
      )}

      {state === 'already' && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" component="p">
            {t('alreadyHeading')}
          </Typography>
          <Typography variant="body1" component="p" sx={{ mt: 1 }}>
            {t('alreadyBody')}
          </Typography>
        </Box>
      )}

      {state === 'error' && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" component="p" sx={{ color: 'error.main' }}>
            {t('errorBody')}
          </Typography>
        </Box>
      )}

      {!state && (
        <Box component="form" action={subscribeToLeadMagnetAction} sx={{ mt: 2 }}>
          {/* SEO-11.4 (mismo precedente que ContactFormBlockComponent): la
              etiqueta es un <label> real, no un placeholder, solo oculta a la vista. */}
          <Box component="label" htmlFor="email-capture-email" sx={visuallyHidden}>
            {t('emailLabel')}
          </Box>
          <input type="hidden" name="postPath" value={postPath} />
          <input type="hidden" name="locale" value={locale} />
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
            <TextField
              id="email-capture-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder={t('emailPlaceholder')}
              sx={{ flex: 1 }}
            />
            <Button type="submit" variant="contained" sx={{ flexShrink: 0 }}>
              {t('submitLabel')}
            </Button>
          </Box>
          {/* Honeypot: oculto vía CSS a usuarios reales, mismo patrón que
              ContactFormBlockComponent/subscribe-lead-magnet.tsx ya esperan
              (`company_website`) — un bot que completa todos los campos cae
              acá y la Server Action lo descarta en silencio. */}
          <Box
            aria-hidden="true"
            sx={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}
          >
            <label htmlFor="email-capture-company-website">Company website</label>
            <input
              type="text"
              id="email-capture-company-website"
              name="company_website"
              tabIndex={-1}
              autoComplete="off"
            />
          </Box>
          <Typography variant="caption" component="p" sx={{ mt: 1.5, color: 'text.secondary' }}>
            {t('privacyPrefix')}
            <Link href={privacyHref} underline="always">
              {t('privacyLinkText')}
            </Link>
            {t('privacySuffix')}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
