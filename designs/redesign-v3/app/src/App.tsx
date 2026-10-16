import { lazy, Suspense } from 'react';
import { SystemPage } from './gallery/SystemPage';
import { HomePage } from './home/HomePage';

// Rutas simples por pathname. / (ES) y /en (EN) pintan la home y entran estaticas: un chunk diferido para la ruta
// critica sumaria un viaje de red al LCP. /rendimiento se carga diferido; cualquier otra ruta pinta /system.
const RendimientoPage = lazy(() => import('./pages/RendimientoPage').then((m) => ({ default: m.RendimientoPage })));

export function App() {
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '') return <HomePage lang="es" />;
  if (path === '/en') return <HomePage lang="en" />;
  if (path === '/rendimiento') {
    return (
      <Suspense fallback={null}>
        <RendimientoPage />
      </Suspense>
    );
  }
  return <SystemPage />;
}
