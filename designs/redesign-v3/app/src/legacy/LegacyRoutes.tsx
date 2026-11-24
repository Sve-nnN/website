// Orden del kit de la fase 51 (unico origen de color y tipografia de /system y /rendimiento): tokens, base, components y effects; la app va al final.
import '../../../assets/css/tokens.css';
import '../../../assets/css/base.css';
import '../../../assets/css/components.css';
import '../../../assets/css/effects.css';
import '../styles/app.css';

import { lazy, Suspense } from 'react';
import { SystemPage } from '../gallery/SystemPage';

const RendimientoPage = lazy(() => import('../pages/RendimientoPage').then((m) => ({ default: m.RendimientoPage })));

/** /rendimiento se carga diferido; cualquier otra ruta pinta /system. */
export default function LegacyRoutes({ path }: { path: string }) {
  if (path === '/rendimiento') {
    return (
      <Suspense fallback={null}>
        <RendimientoPage />
      </Suspense>
    );
  }
  return <SystemPage />;
}
