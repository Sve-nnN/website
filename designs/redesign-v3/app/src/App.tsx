import { lazy, Suspense } from 'react';
import { SystemPage } from './gallery/SystemPage';

// Rutas simples por pathname. /rendimiento se carga diferido; cualquier otra ruta pinta /system.
const RendimientoPage = lazy(() => import('./pages/RendimientoPage').then((m) => ({ default: m.RendimientoPage })));

export function App() {
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '/rendimiento') {
    return (
      <Suspense fallback={null}>
        <RendimientoPage />
      </Suspense>
    );
  }
  return <SystemPage />;
}
