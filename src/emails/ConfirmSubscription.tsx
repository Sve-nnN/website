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
    preview: 'Un clic y quedas dentro. Sin confirmar, tu correo no se activa.',
    heading: 'Confirma tu correo',
    intro:
      'Alguien, probablemente tú, pidió recibir los artículos nuevos de juan-tech.com. Un clic y queda hecho.',
    action: 'Confirmar mi correo',
    fallback: 'Si el botón no abre, copia este enlace en tu navegador:',
    ignore:
      'Si no fuiste tú, ignora este mensaje. Sin ese clic la dirección nunca se activa y no vuelves a recibir nada.',
    what: 'Después de confirmar recibes un correo cuando publico un artículo, sin calendario fijo y sin resúmenes de novedades ajenas.',
  },
  en: {
    preview: 'One click and you are in. Without confirming, your email stays inactive.',
    heading: 'Confirm your email',
    intro:
      'Someone, most likely you, asked to receive new articles from juan-tech.com. One click and it is done.',
    action: 'Confirm my email',
    fallback: 'If the button does not open, copy this link into your browser:',
    ignore:
      'If it was not you, ignore this message. Without that click the address is never activated and nothing else arrives.',
    what: 'After confirming you get an email when I publish an article. No fixed schedule and no roundups of other people’s news.',
  },
} as const

/**
 * Correo de confirmación del doble opt-in.
 *
 * Una sola acción y una sola brasa: el botón. Todo lo demás es texto. Un correo
 * de confirmación con dos botones es un correo que nadie confirma.
 *
 * El enlace va también en texto plano debajo del botón porque hay clientes que
 * no renderizan el `<a>` con estilo de botón, y quedarse sin forma de confirmar
 * es perder el alta entera.
 */
export function ConfirmSubscription({
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
