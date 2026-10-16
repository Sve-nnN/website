import type { Lang } from './HomePage';

// Destinos permitidos (T-52-02): #ancla, rutas de la propia app (/ y /en) y el sitio vivo. Nada de javascript: ni data:.
export const LIVE_ORIGIN = 'https://juan-tech.com';

/** URL de una pagina del sitio vivo; en ingles lleva el prefijo /en. */
export function liveUrl(lang: Lang, path: string): string {
  return `${LIVE_ORIGIN}${lang === 'en' ? '/en' : ''}${path}`;
}
