// Lista cerrada de destinos permitidos en la home (amenaza T-52-02).
// La comparten el componente SafeLink de ui.tsx y la regla V14 del lint, para que no diverjan.
// Sin importaciones y sin acceso a window. Node 24 la carga sin compilar (solo sintaxis borrable).

const EXACT_HOSTS = new Set(['juan-tech.com', 'auditor.juan-tech.com']);
const GITHUB_PATH = '/Sve-nnN/website';
const LINKEDIN_PATH = '/in/juancangulo';

const hasPrefixPath = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

/** Admite #ancla, rutas que empiezan con una sola barra, mailto: y https:// hacia los hosts de la lista. */
export function isAllowedHref(href: string): boolean {
  if (typeof href !== 'string' || href === '') return false;
  // Controles, espacios y barra invertida (`/\host` se interpreta como `//host` en el navegador).
  if (/[\u0000-\u001f\u007f\s\\]/.test(href)) return false;

  if (href.startsWith('#')) return href.length > 1;
  if (href.startsWith('/')) return !href.startsWith('//');
  if (href.startsWith('mailto:')) return /^mailto:[^@/?#]+@[^@/?#]+(\?\S*)?$/.test(href);

  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;

  const host = url.hostname;
  if (EXACT_HOSTS.has(host)) return true;
  if (host === 'github.com') return hasPrefixPath(url.pathname, GITHUB_PATH);
  if (host === 'linkedin.com' || host === 'www.linkedin.com') {
    return url.pathname === LINKEDIN_PATH || url.pathname === `${LINKEDIN_PATH}/`;
  }
  return false;
}

// Destinos del sitio vivo (52-01). Sin importaciones: el tipo de idioma se declara aqui.
export const LIVE_ORIGIN = 'https://juan-tech.com';

/** URL de una pagina del sitio vivo; en ingles lleva el prefijo /en. */
export function liveUrl(lang: 'es' | 'en', path: string): string {
  return `${LIVE_ORIGIN}${lang === 'en' ? '/en' : ''}${path}`;
}
