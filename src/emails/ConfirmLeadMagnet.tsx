// `React` importado explícitamente aunque Next no lo necesite: estas
// plantillas también se renderizan desde scripts sueltos con `tsx`, y ahí el
// JSX sale con la transformación clásica (`React.createElement`) porque el
// tsconfig del proyecto usa `jsx: "preserve"`. Sin este import, cualquier envío
// disparado fuera de Next muere con "React is not defined".
import * as React from 'react'
import { Button, Link, Text } from '@react-email/components'

import { BlogEmailLayout } from './BlogEmailLayout'
import { email as t } from './theme'

const COPY = {
  es: {
    preview: 'Un clic y tu checklist queda listo para descargar.',
    heading: 'Confirma tu correo',
    intro:
      'Pediste el checklist de auditoría SEO técnica de juan-tech.com. Un clic y lo tienes listo para descargar.',
    action: 'Confirmar y descargar',
    fallback: 'Si el botón no abre, copia este enlace en tu navegador:',
    ignore:
      'Si no fuiste tú, ignora este mensaje. Sin ese clic la dirección nunca se activa y no se entrega ningún archivo.',
    what: 'Después de confirmar llegas directo a la descarga del PDF — sin recibir nada más por este medio.',
  },
  en: {
    preview: 'One click and your checklist is ready to download.',
    heading: 'Confirm your email',
    intro:
      'You requested the technical SEO audit checklist from juan-tech.com. One click and it is ready to download.',
    action: 'Confirm and download',
    fallback: 'If the button does not open, copy this link into your browser:',
    ignore:
      'If it was not you, ignore this message. Without that click the address is never activated and no file is delivered.',
    what: 'After confirming you land straight on the PDF download — nothing else gets sent this way.',
  },
} as const

/**
 * Correo de confirmación del doble opt-in del lead magnet (Phase 49-01).
 *
 * Mismo cascarón que `ConfirmSubscription.tsx` — un solo botón, copy bilingüe
 * análoga — pero mencionando el checklist descargable, no "los artículos del
 * blog", porque el destino tras confirmar es la descarga, no `/blog`.
 */
export function ConfirmLeadMagnet({
  confirmUrl,
  locale = 'es',
}: {
  confirmUrl: string
  locale?: 'es' | 'en'
}) {
  const c = COPY[locale] ?? COPY.es

  return (
    <BlogEmailLayout
      preview={c.preview}
      footer={
        <Text style={{ margin: 0, fontSize: '12px', lineHeight: '18px', color: t.color.quietInk }}>
          {c.ignore}
        </Text>
      }
    >
      <Text
        style={{
          margin: '0 0 12px',
          fontFamily: t.font.display,
          fontSize: '26px',
          lineHeight: '30px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: t.color.ink,
        }}
      >
        {c.heading}
      </Text>

      <Text style={{ margin: '0 0 24px', fontSize: '16px', lineHeight: '24px', color: t.color.ink }}>
        {c.intro}
      </Text>

      <Button
        href={confirmUrl}
        style={{
          display: 'inline-block',
          backgroundColor: t.color.ember,
          color: t.color.navy,
          fontSize: '15px',
          fontWeight: 700,
          textDecoration: 'none',
          padding: '12px 22px',
          borderRadius: t.radius.md,
        }}
      >
        {c.action}
      </Button>

      <Text style={{ margin: '24px 0 4px', fontSize: '13px', color: t.color.quietInk }}>
        {c.fallback}
      </Text>
      <Text style={{ margin: 0, fontSize: '13px', lineHeight: '20px', wordBreak: 'break-all' }}>
        <Link href={confirmUrl} style={{ color: t.color.emberText, fontFamily: t.font.mono }}>
          {confirmUrl}
        </Link>
      </Text>

      <Text
        style={{
          margin: '28px 0 0',
          paddingTop: '16px',
          borderTop: `1px solid ${t.color.hairline}`,
          fontSize: '14px',
          lineHeight: '21px',
          color: t.color.quietInk,
        }}
      >
        {c.what}
      </Text>
    </BlogEmailLayout>
  )
}
