// Server Component a propósito: sin 'use client'. Re-viste con MUI los bloques
// del cuerpo de los posts (code-block, table, faq, affiliate-inline y
// email-capture) sobre los convertidores base de richTextBlockConverters.
//
// CONSTRAINT DURA (T-48-09, T-55-18, mismo hazard de TDZ documentado en
// richTextBlockConverters.tsx): este archivo no importa el renderer de rich
// text viejo, el marco de divulgación de afiliados ni el FAQ viejo, ni nada que
// los importe de forma transitiva. Solo lee `richTextBlockConverters` a través
// de MuiRichText, que ya lo importaba.
//
// T-55-23: todo el texto llega como hijo de React (se escapa solo). Ningún
// bloque usa HTML en crudo.
import type { JSXConverter, JSXConverters, JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { ReactNode } from 'react'

import { RichText } from '@payloadcms/richtext-lexical/react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { AffiliateLink as AffiliateLinkDoc } from '@/payload-types'

import { subscribeToLeadMagnetAction } from '@/app/actions/subscribe-lead-magnet'
import { AffiliateLink } from '@/components/AffiliateLink'
import { resolveAffiliateCta } from '@/lib/affiliate-cta'

import { FaqAccordion } from '../FaqAccordion'
import { ScrollRegion } from '../ScrollRegion'
import { CopyCodeButton } from './CopyCodeButton'
import { RichTextLink } from './RichTextLink'

/** Traductor mínimo: lo que devuelve `useTranslations(namespace)` en el servidor. */
export type Translate = (key: string, values?: Record<string, string | number>) => string

/** Contexto por petición con el que MuiRichText arma los convertidores de bloque. */
export type BlockCtx = {
  /** Idioma de la página. */
  locale: 'es' | 'en'
  /** Traductores por namespace (richText, emailCapture, stackPage). */
  t: {
    richText: Translate
    common: Translate
    emailCapture: Translate
    stackPage: Translate
  }
  /** Ruta del post para el campo oculto postPath del bloque email-capture. */
  postPath?: string
  /** Valor de ?subscribed= de la página del post. */
  subscribedState?: string
}

/** Lo que aporta este módulo sobre los convertidores base de MuiRichText. */
export type RichTextOverrides = (args: Parameters<JSXConvertersFunction>[0]) => {
  blocks?: Record<string, JSXConverter<any>>
  table?: JSXConverter<any>
}

type CodeBlockFields = {
  blockType: 'code-block'
  language?: string | null
  code?: string | null
}

/**
 * Bloque de código: contenedor oscuro con el lenguaje como rótulo y el botón
 * Copiar en la cabecera, y el `pre` dentro de ScrollRegion. El `pre` no lleva
 * tabIndex propio: ScrollRegion lo agrega solo cuando desborda, medido en el
 * navegador (A11Y.md sección 6, Pitfall 6).
 */
function renderCodeBlock(fields: CodeBlockFields, ctx: BlockCtx): ReactNode {
  const code = fields.code
  if (!code) return null
  const language = fields.language?.trim() || null

  return (
    <Box
      sx={{
        my: 3,
        borderRadius: 2,
        border: 1,
        borderColor: 'band.border',
        bgcolor: 'band.surface',
        color: 'band.text',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: language ? 'space-between' : 'flex-end',
          gap: 2,
          px: 2,
          py: 1,
          borderBottom: 1,
          borderColor: 'band.border',
        }}
      >
        {language && (
          <Typography variant="caption" component="span" sx={{ fontFamily: 'var(--font-geist-mono)', color: 'band.muted' }}>
            {language}
          </Typography>
        )}
        <CopyCodeButton code={code} />
      </Box>
      <ScrollRegion label={ctx.t.richText('codeRegionLabel')}>
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 2,
            typography: 'mono',
            lineHeight: '1.5rem',
            color: 'band.text',
            // El estilo de `code` en línea de MuiRichText no aplica dentro del bloque.
            '&& code': { p: 0, border: 0, bgcolor: 'transparent', borderRadius: 0, fontSize: 'inherit' },
          }}
        >
          <code>{code}</code>
        </Box>
      </ScrollRegion>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Tabla
// ---------------------------------------------------------------------------

type TableCellNode = {
  headerState?: number
  colSpan?: number
  rowSpan?: number
  children?: unknown[]
}
type TableRowNode = { children?: TableCellNode[] }
type TableNode = { children?: TableRowNode[] }
type NodesToJSX = (args: { nodes: never[] }) => ReactNode

const HEADER_STATE_ROW = 1
const HEADER_STATE_COLUMN = 2

function cellDeclaresHeader(cell: TableCellNode): boolean {
  return typeof cell.headerState === 'number' && cell.headerState > 0
}

/**
 * Tabla con fila de encabezado, aunque el dato no la declare. Las tablas que
 * vinieron de la migración traen `headerState` indefinido en todas las celdas
 * (ocho artículos fallaban el audit td-has-header): si NINGUNA celda lo
 * declara, la primera fila es el encabezado; si alguna lo declara, se respeta
 * el dato. `scope="col"` dice de qué columna es cada encabezado y `scope="row"`
 * marca los encabezados de fila.
 *
 * Una tabla de contenido no trae título en Payload, así que no lleva caption
 * (no se inventa texto). El nombre de región de ScrollRegion no repite texto
 * visible. El estilo de color por celda del editor no se aplica: sobre el tema
 * oscuro podría romper el contraste del texto.
 */
function renderTable(node: TableNode, nodesToJSX: NodesToJSX, ctx: BlockCtx): ReactNode {
  const rows = node.children ?? []
  if (rows.length === 0) return null
  const declaresHeaders = rows.some((row) => (row.children ?? []).some(cellDeclaresHeader))

  const isHeaderCell = (rowIndex: number, cell: TableCellNode) =>
    declaresHeaders ? cellDeclaresHeader(cell) : rowIndex === 0

  const renderRow = (row: TableRowNode, rowIndex: number) => (
    <TableRow key={rowIndex}>
      {(row.children ?? []).map((cell, cellIndex) => {
        const header = isHeaderCell(rowIndex, cell)
        const scope = header
          ? declaresHeaders && !((cell.headerState ?? 0) & HEADER_STATE_ROW) && (cell.headerState ?? 0) & HEADER_STATE_COLUMN
            ? 'row'
            : 'col'
          : undefined
        return (
          <TableCell
            key={cellIndex}
            component={header ? 'th' : 'td'}
            scope={scope}
            colSpan={cell.colSpan && cell.colSpan > 1 ? cell.colSpan : undefined}
            rowSpan={cell.rowSpan && cell.rowSpan > 1 ? cell.rowSpan : undefined}
          >
            {nodesToJSX({ nodes: (cell.children ?? []) as never[] })}
          </TableCell>
        )
      })}
    </TableRow>
  )

  const [firstRow, ...restRows] = rows
  const firstIsHeaderRow =
    (firstRow.children ?? []).length > 0 && (firstRow.children ?? []).every((cell) => isHeaderCell(0, cell))

  return (
    <Box sx={{ my: 3, border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
      <ScrollRegion label={ctx.t.richText('tableRegionLabel')}>
        <Table
          sx={{
            width: '100%',
            borderCollapse: 'collapse',
            '& th, & td': {
              minWidth: 120,
              p: '8px 16px',
              border: 1,
              borderColor: 'divider',
              typography: 'body2',
              color: 'text.primary',
              textAlign: 'left',
              verticalAlign: 'top',
            },
            '& th': { fontWeight: 600, bgcolor: 'raised' },
            '& td p, & th p': { m: 0, typography: 'body2' },
          }}
        >
          {firstIsHeaderRow ? (
            <>
              <TableHead>{renderRow(firstRow, 0)}</TableHead>
              <TableBody>{restRows.map((row, i) => renderRow(row, i + 1))}</TableBody>
            </>
          ) : (
            <TableBody>{rows.map(renderRow)}</TableBody>
          )}
        </Table>
      </ScrollRegion>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

type FaqFields = {
  id?: string | null
  blockType: 'faq'
  title?: string | null
  faqs?:
    | {
        id?: string | null
        question?: string | null
        answer?: Parameters<typeof RichText>[0]['data'] | null
      }[]
    | null
}

/**
 * FAQ sobre FaqAccordion. El prefijo de ids sale del id del bloque (único en
 * la página aunque el cuerpo se parta en dos mitades) y, sin id, del índice del
 * nodo. MUI pone el id del panel desde aria-controls, así que no se repite en
 * AccordionDetails (Pitfall 18). Las respuestas se renderizan con los mismos
 * convertidores que el resto del cuerpo y quedan todas en el HTML del servidor.
 */
function renderFaq(fields: FaqFields, converters: JSXConverters, childIndex: number): ReactNode {
  const faqs = (fields.faqs ?? []).filter((item) => item.question)
  if (faqs.length === 0) return null
  const prefix = `faq-${fields.id ?? childIndex}`
  const title = fields.title?.trim()

  return (
    <Box component="section" sx={{ my: 5 }}>
      {title && (
        <Typography variant="h4" component="h2" sx={{ mb: 3, color: 'text.primary' }}>
          {title}
        </Typography>
      )}
      <FaqAccordion
        idPrefix={prefix}
        defaultOpen={false}
        headingLevel={3}
        items={faqs.map((item) => ({
          question: item.question as string,
          answer: item.answer ? (
            <RichText data={item.answer} converters={converters} disableContainer />
          ) : (
            ''
          ),
        }))}
      />
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Afiliado inline
// ---------------------------------------------------------------------------

type AffiliateInlineFields = {
  blockType: 'affiliate-inline'
  affiliateLink?: (number | null) | AffiliateLinkDoc
}

const HIDDEN = {
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

/**
 * Tarjeta del bloque affiliate-inline con los tres estados de CTA de
 * `resolveAffiliateCta`: activo (botón con AffiliateLink), pendiente (texto) y
 * ninguno (nada en el espacio del CTA). El `rel` lo fija AffiliateLink
 * (sponsored nofollow noopener, T-55-24) y esta tarjeta NO renderiza la
 * divulgación: la coloca el plan del post antes del cuerpo, sobre el contenido
 * completo (Pitfall 19). Sin documento poblado o sin nombre no hay tarjeta.
 */
function renderAffiliateInline(fields: AffiliateInlineFields, ctx: BlockCtx): ReactNode {
  const resolved =
    typeof fields.affiliateLink === 'object' && fields.affiliateLink !== null ? fields.affiliateLink : null
  if (!resolved || !resolved.name) return null

  const { name, tagline } = resolved
  const t = ctx.t.stackPage
  const cta = resolveAffiliateCta(resolved, name, t('ctaDefault', { tool: name }))

  return (
    <Box
      sx={{
        my: 4,
        p: 3,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'grid', gap: 0.5, minWidth: 0 }}>
        <Typography variant="overline" component="p" sx={{ color: 'accentText' }}>
          {t('inlineEyebrow')}
        </Typography>
        <Typography variant="h6" component="p" sx={{ color: 'text.primary' }}>
          {name}
        </Typography>
        {tagline && (
          <Typography variant="body2" component="p" sx={{ color: 'text.secondary' }}>
            {tagline}
          </Typography>
        )}
      </Box>
      {cta.kind === 'active' && (
        <Box
          sx={{
            '& a': {
              display: 'inline-flex',
              alignItems: 'center',
              minHeight: 44,
              px: 2,
              py: 1,
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              typography: 'button',
              textDecoration: 'none',
              '&:hover': { bgcolor: 'primary.dark' },
              '&:focus-visible': { outline: '2px solid var(--jt-palette-accentText)', outlineOffset: 2 },
            },
          }}
        >
          <AffiliateLink href={cta.href}>
            {cta.label}
            <Box component="span" sx={HIDDEN}>
              {` (${ctx.t.common('opensInNewTabAffiliate')})`}
            </Box>
          </AffiliateLink>
        </Box>
      )}
      {cta.kind === 'pending' && (
        <Typography
          variant="caption"
          component="p"
          sx={{ px: 1, py: 0.5, borderRadius: 9999, border: 1, borderColor: 'divider', color: 'text.secondary', fontWeight: 600 }}
        >
          {t('badgePending')}
        </Typography>
      )}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Captura de email
// ---------------------------------------------------------------------------

const SUBSCRIBED_STATES = ['pending', 'already', 'error'] as const
type SubscribedState = (typeof SUBSCRIBED_STATES)[number]

function isSubscribedState(value: string | undefined): value is SubscribedState {
  return value !== undefined && (SUBSCRIBED_STATES as readonly string[]).includes(value)
}

/**
 * Captura de email del post. Publica a la misma acción de servidor de siempre
 * (subscribeToLeadMagnetAction) con los mismos campos: postPath, locale, email
 * y el honeypot company_website. Esa acción responde ?subscribed=pending bajo
 * PREVIEW_READONLY sin escribir (T-55-25); este archivo no la altera.
 * `subscribedState` solo elige cuál de tres textos fijos se muestra, nunca se
 * interpola crudo (T-49-08). Los textos de oferta y consentimiento salen de
 * messages (namespace emailCapture) como antes.
 */
function renderEmailCapture(ctx: BlockCtx): ReactNode {
  const t = ctx.t.emailCapture
  const state = isSubscribedState(ctx.subscribedState) ? ctx.subscribedState : null

  return (
    <Box
      sx={{
        position: 'relative',
        my: 4,
        p: 3,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        display: 'grid',
        gap: 1,
      }}
    >
      <Typography variant="overline" component="p" sx={{ color: 'accentText' }}>
        {t('eyebrow')}
      </Typography>
      <Typography variant="h5" component="p" sx={{ color: 'text.primary' }}>
        {t('heading')}
      </Typography>
      <Typography variant="body1" component="p" sx={{ color: 'text.secondary' }}>
        {t('description')}
      </Typography>

      {state === 'pending' && (
        <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
          <Typography variant="h6" component="p" sx={{ color: 'text.primary' }}>
            {t('pendingHeading')}
          </Typography>
          <Typography variant="body1" component="p" sx={{ color: 'text.primary' }}>
            {t('pendingBody')}
          </Typography>
        </Box>
      )}
      {state === 'already' && (
        <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
          <Typography variant="h6" component="p" sx={{ color: 'text.primary' }}>
            {t('alreadyHeading')}
          </Typography>
          <Typography variant="body1" component="p" sx={{ color: 'text.primary' }}>
            {t('alreadyBody')}
          </Typography>
        </Box>
      )}
      {state === 'error' && (
        <Typography
          id="email-capture-error"
          role="alert"
          variant="body1"
          component="p"
          sx={{ mt: 2, color: 'error.main' }}
        >
          {t('errorBody')}
        </Typography>
      )}

      {/* El formulario sigue visible tras ?subscribed=error para que la persona
          corrija el correo y reintente sin editar la URL. Solo pending y already
          lo reemplazan por su mensaje. */}
      {(!state || state === 'error') && (
        <Box component="form" action={subscribeToLeadMagnetAction} sx={{ mt: 2, display: 'grid', gap: 2 }}>
          <input type="hidden" name="postPath" value={ctx.postPath ?? ''} />
          <input type="hidden" name="locale" value={ctx.locale} />
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: { sm: 'flex-start' } }}>
            <TextField
              id="email-capture-email"
              name="email"
              type="email"
              label={t('emailLabel')}
              placeholder={t('emailPlaceholder')}
              required
              autoComplete="email"
              // Tras un error la pagina recarga completa: se marca el campo como
              // invalido, se enlaza con el mensaje y se lleva el foco aqui para
              // que un lector de pantalla y el teclado retomen donde fallo.
              error={state === 'error'}
              autoFocus={state === 'error'}
              slotProps={{
                htmlInput: state === 'error' ? { 'aria-describedby': 'email-capture-error' } : undefined,
              }}
              sx={{ flex: 1 }}
            />
            <Button type="submit" variant="contained" size="large" sx={{ flexShrink: 0 }}>
              {t('submitLabel')}
            </Button>
          </Box>
          {/* Honeypot: fuera de pantalla y fuera del orden de tabulación; un bot
              que completa todos los campos cae aquí y la acción lo descarta. */}
          <Box aria-hidden="true" sx={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
            <label htmlFor="email-capture-company-website">Company website</label>
            <input type="text" id="email-capture-company-website" name="company_website" tabIndex={-1} autoComplete="off" />
          </Box>
          <Typography variant="body2" component="p" sx={{ color: 'text.secondary' }}>
            {t('privacyPrefix')}
            <RichTextLink href="/privacy">{t('privacyLinkText')}</RichTextLink>
            {t('privacySuffix')}
          </Typography>
        </Box>
      )}
    </Box>
  )
}

/**
 * Convertidores MUI por tipo de bloque. Cada uno conserva el contenido que
 * trae Payload sin reescribirlo; solo cambia la presentación.
 */
export function muiBlockConverters(ctx: BlockCtx): RichTextOverrides {
  return () => ({
    blocks: {
      'code-block': ({ node }: { node: { fields: CodeBlockFields } }) => renderCodeBlock(node.fields, ctx),
      faq: ({
        node,
        converters,
        childIndex,
      }: {
        node: { fields: FaqFields }
        converters: JSXConverters
        childIndex: number
      }) => renderFaq(node.fields, converters, childIndex),
      'affiliate-inline': ({ node }: { node: { fields: AffiliateInlineFields } }) =>
        renderAffiliateInline(node.fields, ctx),
      'email-capture': () => renderEmailCapture(ctx),
    },
    table: ({ node, nodesToJSX }: { node: TableNode; nodesToJSX: NodesToJSX }) =>
      renderTable(node, nodesToJSX, ctx),
  })
}
