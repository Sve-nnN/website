// `React` importado explícitamente aunque Next no lo necesite: estas
// plantillas también se renderizan desde scripts sueltos con `tsx`, y ahí el
// JSX sale con la transformación clásica (`React.createElement`) porque el
// tsconfig del proyecto usa `jsx: "preserve"`. Sin este import, cualquier envío
// disparado fuera de Next muere con "React is not defined".
import * as React from 'react'
import type { ReactNode } from 'react'
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

import { email as t } from './theme'

/**
 * Cáscara compartida de los correos del blog.
 *
 * TRADUCCIÓN DEL SISTEMA VISUAL, no una copia: el sitio abre con un shader
 * granulado sobre navy, y en un correo eso no existe — no hay canvas, y una
 * imagen de fondo se cae en Outlook y en el modo "no cargar imágenes" de media
 * bandeja. Lo que sí viaja es lo que hace reconocible al sitio sin depender de
 * nada: la banda navy, el filete de brasa de 4px cerrándola (el mismo gesto que
 * `PageHero`), el papel #FAFAF7 como superficie de lectura y la brasa reservada
 * para una sola decisión por correo.
 *
 * Todo el estilo va inline por `@react-email/components`. Nada de clases.
 */
export function BlogEmailLayout({
  preview,
  eyebrowHidden,
  children,
  footer,
}: {
  /** Línea que la bandeja muestra al lado del asunto. */
  preview: string
  /** Texto solo para lectores de pantalla, si hace falta. */
  eyebrowHidden?: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: '24px 12px',
          backgroundColor: t.color.paper,
          fontFamily: t.font.body,
          // Evita que iOS y algunos clientes agranden el cuerpo por su cuenta.
          WebkitTextSizeAdjust: '100%',
        }}
      >
        {eyebrowHidden && (
          <Text style={{ display: 'none', maxHeight: 0, overflow: 'hidden', opacity: 0 }}>
            {eyebrowHidden}
          </Text>
        )}

        <Container style={{ width: '100%', maxWidth: t.width, margin: '0 auto' }}>
          {/* Banda navy con el filete de brasa abajo: la firma del sitio que
              sobrevive a cualquier cliente de correo, porque son dos colores
              planos y un borde. */}
          <Section
            style={{
              backgroundColor: t.color.navy,
              borderBottom: `4px solid ${t.color.ember}`,
              padding: '20px 28px',
            }}
          >
            <Text
              style={{
                margin: 0,
                fontFamily: t.font.display,
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: t.color.paper,
              }}
            >
              Juan Carlos Angulo
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: '#FFFFFF',
              border: `1px solid ${t.color.hairline}`,
              borderTop: 'none',
              padding: '32px 28px',
            }}
          >
            {children}
          </Section>

          <Hr style={{ borderColor: t.color.hairline, margin: '24px 0 12px' }} />

          <Section style={{ padding: '0 28px 24px' }}>
            {footer}
            <Text
              style={{
                margin: '12px 0 0',
                fontSize: '12px',
                lineHeight: '18px',
                color: t.color.quietInk,
              }}
            >
              <Link
                href="https://juan-tech.com"
                style={{ color: t.color.quietInk, textDecoration: 'underline' }}
              >
                juan-tech.com
              </Link>
              {' · '}
              Ingeniero de software y consultor SEO técnico
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
