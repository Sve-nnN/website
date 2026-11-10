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

import type { Crumb } from '@/components/mui/Crumbs'
import { PageHero } from '@/components/mui/PageHero'
import { MuiRichText } from '@/components/mui/rich-text/MuiRichText'
import { Toc } from '@/components/mui/rich-text/Toc'
import { TranslationNotice } from '@/components/mui/TranslationNotice'
import type { PostViewProps } from '@/lib/blog-data'

import { PostByline } from './PostByline'

/** Id del elemento article: lo mide la barra de progreso y esta reservado en lexical-toc. */
export const POST_BODY_ID = 'post-body'

type Props = {
  post: PostViewProps
  /** Migas de `buildBlogTrail`, ya con `href`. */
  crumbs: Crumb[]
  /** Nombre del indice (messages post.toc.label), para que la ruta lo resuelva con el idioma. */
  tocLabel: string
  /** Primera mitad del cuerpo (o el cuerpo entero si no se parte). */
  before: SerializedEditorState | null | undefined
  /** Segunda mitad, o null cuando el post es demasiado corto para partirlo. */
  after: SerializedEditorState | null
  /** Mapa de ids calculado sobre el cuerpo COMPLETO (`buildHeadingIdMap`). */
  headingIds: Map<object, string>
  /** Estado de ?subscribed= y ruta con prefijo de idioma, para el bloque de captura de email. */
  ctx: { subscribedState?: string; postPath: string }
}

export function PostView({ post, crumbs, tocLabel, before, after, headingIds, ctx }: Props) {
  // Sin h2 (un h1 del cuerpo cuenta como h2) no hay TOC aunque haya varios h3.
  const showToc = post.headings.length >= 2 && post.headings.some((h) => h.level === 2)
  const twoColumns = showToc

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

      <Box sx={{ pb: { xs: 8, md: 12 } }}>
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
          {showToc && (
            <Box
              sx={{
                gridColumn: { lg: 2 },
                gridRow: { lg: 1 },
                alignSelf: 'start',
                position: { lg: 'sticky' },
                top: { lg: 112 },
                maxHeight: { lg: 'calc(100vh - 144px)' },
                overflowY: { lg: 'auto' },
              }}
            >
              <Toc items={post.headings} label={tocLabel} embedded />
            </Box>
          )}
          <Box component="article" id={POST_BODY_ID} sx={{ gridColumn: { lg: 1 }, gridRow: { lg: 1 }, minWidth: 0 }}>
            <MuiRichText data={before} headingIds={headingIds} ctx={ctx} />
            {after && <MuiRichText data={after} headingIds={headingIds} ctx={ctx} />}
          </Box>
        </Container>
      </Box>
    </>
  )
}
