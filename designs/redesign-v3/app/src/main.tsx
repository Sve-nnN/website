import { createRoot } from 'react-dom/client';
import { App } from './App';

// El CSS vive en cada ruta: la home v4 trae el suyo (src/home/styles) y /system con /rendimiento cargan el kit de la fase 51
// desde src/legacy. Asi los estilos globales del kit no tocan la home.
const root = document.getElementById('root');
if (!root) throw new Error('Falta el elemento #root en index.html');

// Sin React.StrictMode: la doble ejecucion de efectos crea y destruye contextos WebGL y falsea el conteo de canvas en dev.
createRoot(root).render(<App />);
