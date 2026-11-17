'use client'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { CheckCircle2 } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Fragment, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useFormStatus } from 'react-dom'

import { sendContactMessage } from '@/app/actions/contact'

import { linkFor } from './links'

type FieldName = 'name' | 'email' | 'message'
type Errors = Partial<Record<FieldName, string>>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Borrador del ultimo envio valido (IN-02). La accion del servidor responde con
 * una redireccion completa a `?sent=false`, asi que el formulario vuelve vacio.
 * Antes de enviar se guarda lo escrito en `sessionStorage` (solo esta pestana,
 * nunca en la URL ni en la consola); con `?sent=false` se devuelve a los campos
 * y se borra, y con `?sent=true` se borra sin usarlo. El contrato con la accion
 * no cambia.
 */
export const DRAFT_KEY = 'jt-contact-draft'
type Draft = Record<FieldName, string>

function saveDraft(draft: Draft): void {
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // Sin almacenamiento (modo privado estricto o cuota llena): se envia igual.
  }
}

function clearDraft(): void {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    // Nada que limpiar.
  }
}

/** Lee el borrador una sola vez y lo borra. Devuelve null si falta o no tiene la forma esperada. */
function takeDraft(): Draft | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY)
    window.sessionStorage.removeItem(DRAFT_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    const rec = parsed as Record<string, unknown>
    const str = (k: FieldName) => (typeof rec[k] === 'string' ? (rec[k] as string) : '')
    const draft = { name: str('name'), email: str('email'), message: str('message') }
    return draft.name || draft.email || draft.message ? draft : null
  } catch {
    return null
  }
}

type Props = {
  /** `card` para la pagina Contacto, `panel` dentro de CtaPanel. */
  variant: 'card' | 'panel'
  /** Estado que la pagina saca de `searchParams.sent`. */
  status?: 'success' | 'error' | null
  /** Correo que se muestra en el mensaje de fallo. */
  email: string
  /** Id del encabezado que nombra al formulario (variante card). */
  headingId?: string
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="contained" size="large" fullWidth disabled={pending} aria-busy={pending || undefined}>
      {label}
    </Button>
  )
}

/**
 * Formulario unico, compartido por CtaPanel y por la pagina Contacto.
 *
 * Mejora progresiva: `action` es la accion real `sendContactMessage`, asi que
 * envia sin JavaScript. La validacion del cliente solo agrega: si falta algo
 * llama a `preventDefault`, pinta los errores y lleva el foco al primer campo
 * invalido; si todo es valido no interviene y corre la accion del servidor.
 *
 * Contrato con la accion (no cambiar): name, email y message, el campo oculto
 * `locale` y el honeypot `company_website`. No hay campo de servicio ni de
 * sitio web: la accion no los lee.
 */
export function ContactForm({ variant, status = null, email, headingId = 'form-t' }: Props) {
  const t = useTranslations('contact')
  const locale = useLocale()
  const uid = useId()
  const [errors, setErrors] = useState<Errors>({})
  const [draft, setDraft] = useState<Draft | null>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const panel = variant === 'panel'

  // El resultado llega con una redireccion completa: al montar, el foco pasa al
  // contenedor de estado para que el lector de pantalla anuncie el resultado.
  useEffect(() => {
    if (status) statusRef.current?.focus()
  }, [status])

  // Tras un fallo, devuelve lo escrito a los campos; tras un exito, descarta el borrador.
  useEffect(() => {
    if (status === 'success') clearDraft()
    if (status !== 'error') return
    const saved = takeDraft()
    if (saved) setDraft(saved)
  }, [status])

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    const data = new FormData(e.currentTarget)
    const next: Errors = {}
    if (!String(data.get('name') ?? '').trim()) next.name = t('form.errors.name')
    if (!EMAIL.test(String(data.get('email') ?? '').trim())) next.email = t('form.errors.email')
    if (!String(data.get('message') ?? '').trim()) next.message = t('form.errors.message')
    setErrors(next)
    const first = (['name', 'email', 'message'] as const).find((k) => next[k])
    if (!first) {
      saveDraft({
        name: String(data.get('name') ?? ''),
        email: String(data.get('email') ?? ''),
        message: String(data.get('message') ?? ''),
      })
      return
    }
    e.preventDefault()
    const el = formRef.current?.elements.namedItem(first)
    if (el instanceof HTMLElement) el.focus()
  }

  if (status === 'success') {
    return (
      <Card
        ref={statusRef}
        role="status"
        tabIndex={-1}
        sx={{ p: { xs: 4, md: 6 }, display: 'grid', gap: 2, justifyItems: 'start' }}
      >
        <Box sx={{ color: 'success.main', display: 'flex' }}>
          <CheckCircle2 size={40} aria-hidden="true" />
        </Box>
        <Typography variant="h4" component="h2">
          {t('form.success.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('form.success.body')}
        </Typography>
        <Button variant="outlined" component={linkFor('/contact')} href="/contact">
          {t('form.success.again')}
        </Button>
      </Card>
    )
  }

  const hasErrors = Object.keys(errors).length > 0
  const fieldId = (name: FieldName) => `${uid}-${name}`
  const shared = {
    required: true,
    fullWidth: true,
  } as const

  // La key cambia al recuperar el borrador: los campos se montan de nuevo con su
  // defaultValue y la etiqueta de MUI queda arriba, sin pisar el texto.
  const fields = (
    <Fragment key={draft ? 'draft' : 'blank'}>
      <input type="hidden" name="locale" value={locale} />
      {/* Trampa para bots: fuera de pantalla, oculta a la vista y a las
          tecnologias de apoyo, sin foco. Un bot que la llene es descartado. */}
      <Box
        aria-hidden="true"
        sx={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }}
      >
        <label htmlFor={`${uid}-company`}>{t('form.honeypotLabel')}</label>
        <input id={`${uid}-company`} type="text" name="company_website" tabIndex={-1} autoComplete="off" />
      </Box>
      <TextField
        {...shared}
        id={fieldId('name')}
        name="name"
        label={t('form.name')}
        autoComplete="name"
        defaultValue={draft?.name}
        error={Boolean(errors.name)}
        helperText={errors.name}
      />
      <TextField
        {...shared}
        id={fieldId('email')}
        name="email"
        type="email"
        label={t('form.email')}
        autoComplete="email"
        defaultValue={draft?.email}
        error={Boolean(errors.email)}
        helperText={errors.email}
      />
      <TextField
        {...shared}
        id={fieldId('message')}
        name="message"
        label={t('form.message')}
        multiline
        minRows={panel ? 4 : 5}
        defaultValue={draft?.message}
        error={Boolean(errors.message)}
        helperText={errors.message}
      />
      {hasErrors && (
        <Typography role="alert" variant="body2" sx={{ color: 'error.main' }}>
          {t('form.errors.summary')}
        </Typography>
      )}
      <SubmitButton label={t('form.submit')} />
    </Fragment>
  )

  const failure =
    status === 'error' ? (
      <Box ref={statusRef} tabIndex={-1} sx={{ outline: 'none' }}>
        <Alert severity="error" role="alert">
          {t('form.failure', { email })}
        </Alert>
      </Box>
    ) : null

  if (panel) {
    return (
      <Box
        component="form"
        ref={formRef}
        noValidate
        action={sendContactMessage}
        onSubmit={onSubmit}
        aria-label={t('cta.formLabel')}
        sx={{
          position: 'relative',
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderRadius: 3,
          p: { xs: 3, md: 4 },
          display: 'grid',
          gap: 2.5,
          boxShadow: '0 32px 64px -24px rgba(0,0,0,0.6)',
        }}
      >
        {failure}
        {fields}
      </Box>
    )
  }

  return (
    <Card
      component="form"
      ref={formRef}
      noValidate
      action={sendContactMessage}
      onSubmit={onSubmit}
      aria-labelledby={headingId}
      sx={{
        position: 'relative',
        p: { xs: 3, md: 5 },
        display: 'grid',
        gap: 2.5,
        boxShadow: '0 32px 64px -28px rgba(0,0,0,0.6)',
      }}
    >
      <Typography id={headingId} variant="h5" component="h2">
        {t('form.title')}
      </Typography>
      {failure}
      {fields}
    </Card>
  )
}
