// Server Component a proposito (sin directiva de cliente): compone el cuerpo del
// post con MuiRichText (que lee los mensajes en el servidor) y deja a los
// componentes cliente solo lo interactivo (indice, firma, tarjetas). Todo lo que
// le pasa a un componente cliente es serializable (Pitfall 17).
//
// El cuerpo se pinta en DOS mitades porque `splitContentForOffer` parte el
// Lexical para colocar la oferta inline entre ellas. Las dos mitades comparten
// el mismo `headingIds`, calculado UNA vez por la ruta sobre el contenido
// completo (Pitfall 2): la numeracion de ids no se reinicia en la segunda mitad
// y el indice apunta a los mismos ids que renderiza el cuerpo.
//
// No declara landmark principal (lo pone el layout) y el unico h1 es el del
// PageHero.
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'

import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

import type { Crumb } from '@/components/mui/Crumbs'
import { PageHero } from '@/components/mui/PageHero'
import { ReadingProgress } from '@/components/mui/ReadingProgress'
import { MuiRichText } from '@/components/mui/rich-text/MuiRichText'
import { Toc } from '@/components/mui/rich-text/Toc'
import { TranslationNotice } from '@/components/mui/TranslationNotice'
import type { PostInlineOffer, PostRailOffer, PostViewProps } from '@/lib/blog-data'

import { InlineOfferMui } from './InlineOfferMui'
import { PostByline } from './PostByline'
import { RailOfferMui } from './RailOfferMui'

/** Id del elemento article: lo mide la barra de progreso y esta reservado en lexical-toc. */
export const POST_BODY_ID = 'post-body'

type Props = {
  post: PostViewProps
  /** Migas de `buildBlogTrail`, ya con `href`. */
  crumbs: Crumb[]
  /** Nombre del indice (messages post.toc.label), para que la ruta lo resuelva con el idioma. */
  tocLabel: string
  /** Nombre accesible de la barra de progreso (messages post.progress.label). */
  progressLabel: string
  /**
   * Divulgacion de afiliados. La ruta la calcula con `postHasAffiliateInline` y
   * `postHasAmazonAffiliateInline` sobre `doc.content` ENTERO, nunca sobre las
   * mitades (D-20, Pitfall 19). null si el post no trae afiliado inline.
   */
  disclosure: { amazon: boolean } | null
  /** Oferta inline, entre las dos mitades. Solo se pinta si el cuerpo se partio. */
  inlineOffer: PostInlineOffer | null
  /** Tarjeta de riel de escritorio, bajo el indice. */
  railOffer: PostRailOffer | null
  /** Primera mitad del cuerpo (o el cuerpo entero si no se parte). */
  before: SerializedEditorState | null | undefined
  /** Segunda mitad, o null cuando el post es demasiado corto para partirlo. */
  after: SerializedEditorState | null
  /** Mapa de ids calculado sobre el cuerpo COMPLETO (`buildHeadingIdMap`). */
  headingIds: Map<object, string>
  /** Estado de ?subscribed= y ruta con prefijo de idioma, para el bloque de captura de email. */
  ctx: { subscribedState?: string; postPath: string }
}

export function PostView({
  post,
  crumbs,
  tocLabel,
  progressLabel,
  disclosure,
  inlineOffer,
  railOffer,
  before,
  after,
  headingIds,
  ctx,
}: Props) {
  const tDisclosure = useTranslations('affiliateDisclosure')
  // Sin h2 (un h1 del cuerpo cuenta como h2) no hay TOC aunque haya varios h3.
  const showToc = post.headings.length >= 2 && post.headings.some((h) => h.level === 2)
  const showRail = railOffer !== null
  const twoColumns = showToc || showRail

  return (
    <>
      {post.translationNotice && <TranslationNotice esHref={post.translationNotice.esHref} />}
      <PageHero compact crumbs={crumbs} title={post.title}>
        <PostByline
          author={post.author}
          dateISO={post.dateISO}
          readingMinutes={post.readingMinutes}
          categories={post.categories}
        />
      </PageHero>

      {/* Mide el articulo, no la pagina. Es fija: su lugar en el DOM no importa. */}
      <ReadingProgress targetId={POST_BODY_ID} label={progressLabel} />

      <Box sx={{ pb: { xs: 8, md: 12 } }}>
        {/* La divulgacion va ANTES del cuerpo y de cualquier enlace de afiliado
            (D-20, T-55-40): el escaneo ya cubrio el contenido entero. */}
        {disclosure && (
          <Container maxWidth="lg" sx={{ pb: 4 }}>
            <Box
              id="post-disclosure"
              role="note"
              sx={{ maxWidth: 760, p: 2, borderRadius: 2, border: 1, borderColor: 'divider', bgcolor: 'raised' }}
            >
              <Typography variant="body2" color="text.secondary">
                {tDisclosure('generalDisclosure')}
                {disclosure.amazon ? ` ${tDisclosure('amazonDisclosure')}` : null}
              </Typography>
            </Box>
          </Container>
        )}

        <Container
          maxWidth="lg"
          sx={{
            display: 'grid',
            gridTemplateColumns: twoColumns
              ? { xs: 'minmax(0,1fr)', lg: 'minmax(0,760px) 260px' }
              : 'minmax(0,760px)',
            justifyContent: twoColumns ? 'space-between' : 'start',
            columnGap: 8,
            rowGap: 2,
          }}
        >
          {twoColumns && (
            <Box
              sx={{
                // Sin indice, la columna solo lleva la tarjeta de riel, que ya se
                // oculta bajo lg: no deja un hueco en movil.
                display: { xs: showToc ? 'block' : 'none', lg: 'block' },
                gridColumn: { lg: 2 },
                gridRow: { lg: 1 },
                alignSelf: 'start',
                // El sticky y el desplazamiento los pone la columna entera, asi el
                // indice y la tarjeta suben y bajan como una sola pieza.
                position: { lg: 'sticky' },
                top: { lg: 112 },
                maxHeight: { lg: 'calc(100vh - 144px)' },
                overflowY: { lg: 'auto' },
              }}
            >
              {showToc && <Toc items={post.headings} label={tocLabel} embedded />}
              {railOffer && <RailOfferMui offer={railOffer} />}
            </Box>
          )}
          <Box component="article" id={POST_BODY_ID} sx={{ gridColumn: { lg: 1 }, gridRow: { lg: 1 }, minWidth: 0 }}>
            <MuiRichText data={before} headingIds={headingIds} ctx={ctx} />
            {after && (
              <>
                {inlineOffer && <InlineOfferMui offer={inlineOffer} />}
                <MuiRichText data={after} headingIds={headingIds} ctx={ctx} />
              </>
            )}
          </Box>
        </Container>
      </Box>
    </>
  )
}
