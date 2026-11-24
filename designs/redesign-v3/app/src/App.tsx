import { lazy, Suspense } from 'react';
import { HomePage } from './home/HomePage';

// Rutas simples por pathname. / (ES) y /en (EN) pintan la home v4 y entran estaticas: un chunk diferido para la ruta
// critica sumaria un viaje de red al LCP. /system y /rendimiento cargan aparte, con el CSS del kit de la fase 51 (no entra a la home).
const LegacyRoutes = lazy(() => import('./legacy/LegacyRoutes'));

export function App() {
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '') return <HomePage lang="es" />;
  if (path === '/en') return <HomePage lang="en" />;
  return (
    <Suspense fallback={null}>
      <LegacyRoutes path={path} />
    </Suspense>
  );
}
