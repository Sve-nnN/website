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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { subscribeToLeadMagnetAction } from '@/app/actions/subscribe-lead-magnet'

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

  return (
    <div className="not-prose my-8 rounded-lg border border-border bg-card shadow-sm p-6">
      <p className="text-label uppercase tracking-wide opacity-70">{t('eyebrow')}</p>
      <p className="font-heading text-heading mt-1">{t('heading')}</p>
      <p className="text-body text-muted-foreground mt-2">{t('description')}</p>

      {state === 'pending' && (
        <div className="mt-4">
          <p className="font-heading text-heading">{t('pendingHeading')}</p>
          <p className="text-body mt-2">{t('pendingBody')}</p>
        </div>
      )}

      {state === 'already' && (
        <div className="mt-4">
          <p className="font-heading text-heading">{t('alreadyHeading')}</p>
          <p className="text-body mt-2">{t('alreadyBody')}</p>
        </div>
      )}

      {state === 'error' && (
        <div className="mt-4">
          <p className="text-body text-destructive">{t('errorBody')}</p>
        </div>
      )}

      {!state && (
        <form action={subscribeToLeadMagnetAction} className="mt-4">
          {/* SEO-11.4 (mismo precedente que ContactFormBlockComponent): la
              etiqueta es un <label> real, no un placeholder — el eyebrow +
              heading de arriba ya dejan visualmente claro el propósito del
              campo, así que sr-only es aceptable acá (a diferencia del
              formulario de contacto, con 3 campos indiferenciados). */}
          <label htmlFor="email-capture-email" className="sr-only">
            {t('emailLabel')}
          </label>
          <input type="hidden" name="postPath" value={postPath} />
          <input type="hidden" name="locale" value={locale} />
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="email-capture-email"
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder={t('emailPlaceholder')}
              className="h-11 flex-1"
            />
            <Button type="submit" className="h-11 shrink-0">
              {t('submitLabel')}
            </Button>
          </div>
          {/* Honeypot: oculto vía CSS a usuarios reales, mismo patrón que
              ContactFormBlockComponent/subscribe-lead-magnet.tsx ya esperan
              (`company_website`) — un bot que completa todos los campos cae
              acá y la Server Action lo descarta en silencio. */}
          <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
            <label htmlFor="email-capture-company-website">Company website</label>
            <input
              type="text"
              id="email-capture-company-website"
              name="company_website"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <p className="text-label text-muted-foreground mt-3">
            {t('privacyPrefix')}
            <a href={privacyHref} className="text-primary-text underline">
              {t('privacyLinkText')}
            </a>
            {t('privacySuffix')}
          </p>
        </form>
      )}
    </div>
  )
}
