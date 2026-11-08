/**
 * Manifiesto de fotos y logos de la fase 54 (scripts 21 y 22).
 *
 * Las rutas son relativas a la raíz del repo. El sandbox
 * (designs/design-system-mui) no está bajo git: la precondición del plan es que
 * exista en esta máquina.
 *
 * `heavy`: se convierte a WebP con sharp (ancho máximo 1600 px, misma
 * proporción) en un directorio temporal del sistema antes de subir. escritorio.png
 * pesa 1,9 MB (Pitfall 10): subirlo tal cual castiga el LCP de la home.
 */
const IMG = 'designs/design-system-mui/public/img'

export type PhotoEntry = {
  key: string
  /** Ruta de origen relativa al repo. */
  file: string
  width: number
  height: number
  heavy: boolean
  alt: string
  caption?: string
  target:
    | { global: 'about-page'; path: 'hero.photo' }
    | { global: 'home-page'; path: 'about.photos[].image'; index: number }
}

export type LogoEntry = {
  /** Nombre propio de la herramienta tal como está en el doc stack. */
  toolName: string
  file: string
  alt: string
}

const logo = (file: string, toolName: string): LogoEntry => ({
  toolName,
  file: `${IMG}/stack/${file}`,
  alt: toolName,
})

export const MEDIA_MANIFEST: { photos: PhotoEntry[]; logos: LogoEntry[] } = {
  photos: [
    {
      key: 'about-hero',
      file: `${IMG}/juan-sobre-mi.webp`,
      width: 1122,
      height: 1402,
      heavy: false,
      // BORRADOR de A11Y-DECISIONS.md (2026-11-06): Juan lo confirma con --alts-confirmed antes de subir.
      alt: 'Juan Carlos Angulo sonriendo, con gafas y chaqueta negra sobre una camisa clara, frente a una pared gris con una lámpara cálida y una planta trepadora a un lado',
      target: { global: 'about-page', path: 'hero.photo' },
    },
    {
      key: 'home-about-taller',
      file: `${IMG}/taller.jpg`,
      width: 1600,
      height: 1200,
      heavy: false,
      alt: 'Juan Carlos Angulo dando el taller de SEO técnico, con la diapositiva de introducción al SEO técnico detrás',
      caption: 'Taller de SEO técnico en Venezuela SEO Fest 2024',
      target: { global: 'home-page', path: 'about.photos[].image', index: 0 },
    },
    {
      key: 'home-about-escritorio',
      file: `${IMG}/escritorio.png`,
      width: 1448,
      height: 1086,
      heavy: true,
      alt: 'Juan Carlos Angulo trabajando frente a una laptop, con luz cálida de ventana',
      target: { global: 'home-page', path: 'about.photos[].image', index: 1 },
    },
    {
      key: 'home-about-retrato',
      file: `${IMG}/retrato-v2.jpg`,
      width: 900,
      height: 1125,
      heavy: false,
      alt: 'Juan Carlos Angulo con chaqueta oscura, sonriendo, con luces cálidas detrás',
      target: { global: 'home-page', path: 'about.photos[].image', index: 2 },
    },
  ],
  logos: [
    logo('ahrefs.webp', 'Ahrefs'),
    logo('cloudinary.webp', 'Cloudinary'),
    logo('dataforseo.webp', 'DataForSEO'),
    logo('digitalocean.webp', 'DigitalOcean'),
    logo('dinorank.webp', 'DinoRANK'),
    logo('hostinger.webp', 'Hostinger'),
    logo('kinsta.webp', 'Kinsta'),
    logo('payload.webp', 'Payload'),
    logo('resend.webp', 'Resend'),
  ],
}
