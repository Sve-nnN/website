// Orden fijo: tokens, base y efectos de la fase 51 (unico origen de color y tipografia), luego la app.
import '../../assets/css/tokens.css';
import '../../assets/css/base.css';
import '../../assets/css/effects.css';
import './styles/app.css';

import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Falta el elemento #root en index.html');

// Sin React.StrictMode: la doble ejecucion de efectos crea y destruye contextos WebGL y falsea el conteo de canvas en dev.
createRoot(root).render(<App />);
