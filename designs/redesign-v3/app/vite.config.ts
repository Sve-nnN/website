import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Carpeta padre de la app: designs/redesign-v3. Es la unica ruta que el servidor de desarrollo puede servir por /@fs/.
const designsRoot = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    fs: { allow: [designsRoot] },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
  },
  build: {
    manifest: true,
    target: 'es2022',
    sourcemap: false,
  },
});
