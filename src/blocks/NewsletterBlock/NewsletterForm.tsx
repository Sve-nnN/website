'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { usePathname } from 'next/navigation'

import { subscribeAction, type SubscribeState } from '@/app/actions/subscribe'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const COPY = {
  es: {
    success: 'Revisa tu correo: te mandé un enlace para confirmar el alta. Sin ese clic no queda activa.',
    invalid: 'Ese correo no parece válido. Revísalo e inténtalo otra vez.',
    error: 'No se pudo completar el alta. Inténtalo de nuevo en un rato.',
    unconfigured: 'El alta no está disponible en este momento. Escríbeme por el formulario de contacto.',
    sending: 'Enviando…',
  },
  en: {
    success: 'Check your inbox: I sent you a link to confirm. Without that click the signup is not active.',
    invalid: "That email doesn't look valid. Check it and try again.",
    error: "Couldn't complete the signup. Try again in a bit.",
    unconfigured: 'Signup is unavailable right now. Reach me through the contact form instead.',
    sending: 'Sending…',
  },
}

function SubmitButton({ label, sendingLabel }: { label: string; sendingLabel: string }) {
  // `useFormStatus` tiene que leerse desde un hijo del <form>, no desde el
  // componente que lo renderiza — desde el padre siempre devuelve pending:false.
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className="sm:w-auto w-full">
      {pending ? sendingLabel : label}
    </Button>
  )
}

export function NewsletterForm({
  locale,
  emailLabel,
  submitLabel,
  consentText,
}: {
  locale: 'es' | 'en'
  emailLabel: string
  submitLabel: string
  consentText?: string | null
}) {
  const [state, formAction] = useActionState<SubscribeState, FormData>(subscribeAction, {
    status: 'idle',
  })
  // De dónde salió el alta. Sirve para saber qué artículo trae suscriptores, y
  // es la ruta, no un identificador de persona.
  const pathname = usePathname()
  const t = COPY[locale] ?? COPY.es

  const message =
    state.status === 'success'
      ? t.success
      : state.status === 'invalid'
        ? t.invalid
        : state.status === 'unconfigured'
          ? t.unconfigured
          : state.status === 'error'
            ? t.error
            : null

  const isError = state.status === 'invalid' || state.status === 'error' || state.status === 'unconfigured'

  return (
    <form action={formAction} className="mt-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="source" value={pathname ?? ''} />
      {/* Honeypot fuera de pantalla, mismo patrón que el formulario de
          contacto. `aria-hidden` + tabIndex -1 lo saca del recorrido real. */}
      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="newsletter_company_website">Company website</label>
        <input
          type="text"
          id="newsletter_company_website"
          name="company_website"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          {/* Label visible, no placeholder: un placeholder desaparece al
              escribir y deja el campo sin nombre para quien vuelve a revisarlo. */}
          <label htmlFor="newsletter-email" className="block text-label opacity-85">
            {emailLabel}
          </label>
          <Input
            id="newsletter-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            aria-describedby={message ? 'newsletter-status' : undefined}
            aria-invalid={isError || undefined}
            className="mt-2 border-secondary-foreground/30 text-secondary-foreground placeholder:text-secondary-foreground/50"
          />
        </div>
        <SubmitButton label={submitLabel} sendingLabel={t.sending} />
      </div>

      {consentText && <p className="mt-3 text-label opacity-70">{consentText}</p>}

      {/* `aria-live` para que el resultado llegue a un lector de pantalla sin
          mover el foco, y color + texto para que no dependa solo del color. */}
      <p
        id="newsletter-status"
        role="status"
        aria-live="polite"
        className={`mt-3 text-label ${isError ? 'text-destructive-lift' : 'text-primary'}`}
      >
        {message}
      </p>
    </form>
  )
}
