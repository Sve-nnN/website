import { lazy, Suspense } from 'react';
import type { Lang } from './HomePage';

// El pie completo (columnas, listas del sitio vivo y su JSON, footer.json) vive en FooterBody, en un chunk aparte:
// el pie solo se pinta cuando las secciones ya montaron, asi que no debe pesar en la ruta critica del LCP.
const FooterBody = lazy(() => import('./FooterBody'));

/** Pie de la home (clase site-footer). Ver FooterBody.tsx. */
export function Footer({ lang }: { lang: Lang }) {
  return (
    <Suspense fallback={null}>
      <FooterBody lang={lang} />
    </Suspense>
  );
}
