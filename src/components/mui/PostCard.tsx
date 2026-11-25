// Sin 'use client' (fase 60): en el indice, la categoria y los relacionados se
// pinta como Server Component y no se hidrata; en los resultados de busqueda la
// usa un componente cliente. Estilos en `src/theme/static.css`.
import { ArrowRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { AppLink } from '@/components/static/AppLink'
import { cloudinarySrcSet, cloudinaryWidth } from '@/lib/cloudinary-resize'

import { formatLongDateUtc } from './format-date'

/** Anchos pedidos a Cloudinary: tarjeta movil, tarjeta de escritorio y destacada. */
const CARD_IMAGE_WIDTHS = [480, 800, 1200] as const

export type PostCardImage = {
  url: string
  alt?: string | null
  width?: number | null
  height?: number | null
}

type Props = {
  /** Ruta del post sin prefijo de idioma (la arma `blog-paths` en el servidor). */
  href: string
  title: string
  excerpt?: string | null
  /** Nombre de la categoría, ya resuelto en el idioma de la página. */
  categoryLabel?: string | null
  /** Fecha de publicación en ISO. */
  dateISO?: string | null
  /** Portada de Payload o null. Sin imagen no se reserva un recuadro vacío. */
  image?: PostCardImage | null
  /** Nivel del encabezado del título, para respetar la jerarquía de la página. */
  headingLevel?: 2 | 3 | 4
  /**
   * Entrada destacada: con imagen y desde `md` pone la portada a la izquierda y el
   * texto a la derecha. No cambia el marcado ni el orden de lectura.
   */
  featured?: boolean
}

/**
 * Tarjeta de post compartida por el índice del blog, la categoría, los
 * relacionados y el perfil de autor. Todas las props son serializables: el
 * enlace se resuelve aquí con `AppLink` (Pitfall 17) y nunca llega como
 * `component` desde un Server Component.
 *
 * El título es el enlace y se estira con `::after` a toda la tarjeta; su
 * `outline` queda en none y el foco se dibuja en la tarjeta con
 * `:has(a:focus-visible)`. El nombre accesible del enlace es el título visible.
 * No calcula tiempo de lectura: necesita el cuerpo completo del post (solo lo
 * muestran la página del post y la entrada destacada).
 *
 * Escalas aceptadas: título 20/28 con peso 600 (rol h6), resumen 16/24,
 * metadatos 14 y 12 px.
 */
export function PostCard({
  href,
  title,
  excerpt,
  categoryLabel,
  dateISO,
  image = null,
  headingLevel = 3,
  featured = false,
}: Props) {
  const t = useTranslations('richText')
  const locale = useLocale()
  const date = formatLongDateUtc(dateISO, locale)
  const sideBySide = featured && Boolean(image)

  const card = ['jt-card', 'jt-postcard', image ? 'jt-postcard--image' : '', sideBySide ? 'jt-postcard--side' : '']
    .filter(Boolean)
    .join(' ')
  const Heading = `h${headingLevel}` as const

  return (
    <div className={card}>
      {image && (
        <div className="jt-postcard__media">
          <img
            className="jt-postcard__image"
            src={cloudinaryWidth(image.url, 800)}
            srcSet={cloudinarySrcSet(image.url, CARD_IMAGE_WIDTHS)}
            sizes={sideBySide ? '(min-width: 900px) 55vw, 100vw' : '(min-width: 1200px) 400px, (min-width: 900px) 50vw, 100vw'}
            alt={image.alt ?? ''}
            width={image.width && image.height ? image.width : 1200}
            height={image.width && image.height ? image.height : 525}
            loading="lazy"
          />
        </div>
      )}
      <div className={sideBySide ? 'jt-postcard__body jt-postcard__body--side' : 'jt-postcard__body'}>
        {categoryLabel && <p className="jt-overline jt-accent">{categoryLabel}</p>}
        <Heading className="jt-h6 jt-clamp3">
          <AppLink className="jt-link jt-postcard__link jt-stretched" href={href}>
            {title}
          </AppLink>
        </Heading>
        {excerpt && <p className="jt-body1 jt-secondary jt-clamp3">{excerpt}</p>}
        <div className="jt-postcard__meta">
          {date && dateISO ? (
            <time className="jt-body2" dateTime={dateISO}>
              {date}
            </time>
          ) : (
            <span />
          )}
          <span className="jt-body2 jt-accent jt-postcard__more" aria-hidden="true">
            {t('readPost')}
            <ArrowRight size={14} aria-hidden="true" />
          </span>
        </div>
      </div>
    </div>
  )
}
