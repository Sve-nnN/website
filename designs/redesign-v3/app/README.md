# Entorno React de mockups con los originales de React Bits

## Qué es

Es una app aislada (Vite, React 19 y TypeScript) que monta los 16 componentes originales de React Bits sobre los tokens de la fase 51.
Los portes vanilla de la fase 51 quedan como referencia de peso y como fallback CSS de cada tarjeta.
No toca el sitio Payload: vive entera en `designs/redesign-v3/app/` y tiene su propio `package.json` y su propio lockfile.

## Requisitos

- Node 20.19 o superior (lo probé con Node 24).
- Red para `npm install`: el `postinstall` trae los originales del registro de React Bits y verifica sus hashes.

## Comandos

Desde la raíz del repositorio:

```bash
cd designs/redesign-v3/app
npm install
npm run dev
npm run build
npm run preview
npm run typecheck
npm run originals:verify
npm run verify
npm run measure
```

- `npm run dev` levanta el servidor de desarrollo en el puerto 5173.
- `npm run build` ejecuta `tsc` estricto y el build de producción en `dist/`.
- `npm run preview` sirve ese build en el puerto 4173.
- `npm run verify` corre el harness de Playwright (tracer, gallery, report y readme). Necesita `dist/`.
- `npm run measure` construye, mide pesos y corre 12 corridas de Lighthouse. Tarda entre 5 y 10 minutos.

## Direcciones

Servidor de desarrollo (`npm run dev`):

- http://127.0.0.1:5173/system
- http://127.0.0.1:5173/rendimiento

Build de producción servido (`npm run preview`):

- http://127.0.0.1:4173/system
- http://127.0.0.1:4173/system?mount=grainient
- http://127.0.0.1:4173/rendimiento

## Qué abrir

1. Ejecuta `npm install` y `npm run dev`, y abre `/system`.
2. En cada tarjeta, pulsa "Montar original" y compara el componente con el fallback CSS que ves antes de montarlo.
3. Con un original montado, pulsa "Pausar animaciones": el original se desmonta y la pausa sigue después de recargar.
4. Activa "Reducir movimiento" en el sistema (Ajustes del Sistema, Accesibilidad, Pantalla) y recarga: solo ves el fallback y un aviso con el motivo.
5. Ejecuta `npm run build` y `npm run preview`, y abre `/system?mount=grainient` para ver un original montado en el build de producción.
6. Abre `/rendimiento` y revisa el peso de cada original contra el porte vanilla y las medianas de Lighthouse.
7. Elige cuáles originales pasan a las páginas de las fases 52 a 55.
8. Confirma la política de no versionar los originales que describe `LICENSES.md`.

## Cómo funciona el cupo

- Monto un solo original a la vez: montar otro desmonta el anterior.
- Cada original se carga con `React.lazy` cuando pulsas el botón o cuando llega `?mount=<nombre>` después del evento `load`.
- El original se desmonta cuando sale del viewport, cuando la pestaña queda oculta, con la pausa y con los bloqueos.
- Los bloqueos son "Pausar animaciones", `prefers-reduced-motion: reduce` y `navigator.connection.saveData`.
- Las superficies de lectura (`data-surface="reading"`) nunca montan un original.

## Dónde viven los originales

Quedan instalados en `src/components/reactbits/`, fuera de git. El repositorio es público y la Commons Clause no permite redistribuir los componentes.
`reactbits.manifest.json` guarda los hashes y `npm install` los reconstruye.
El detalle de licencias está en `LICENSES.md`.
Para versionarlos tendrías que quitar esta línea de `designs/redesign-v3/app/.gitignore`:

```
src/components/reactbits/
```

Publicar los archivos no se puede deshacer, así que confírmalo antes. Esto no es asesoría legal.

## Problemas comunes

- Puerto ocupado: usa `npm run dev -- --port 5180`.
- Usa `127.0.0.1` y no `localhost`: `localhost` puede resolver solo por IPv6 y el servidor escucha en IPv4.
- Sin red, el `postinstall` conserva los originales ya instalados si el hash coincide.
- Playwright y Lighthouse se resuelven desde el `node_modules` del repositorio principal, no desde la app. Define `LIGHTHOUSE_BIN` si usas otro binario.
- Chromium headless renderiza WebGL por software: el TBT sale exagerado. Confirma los tiempos en una GPU real.
