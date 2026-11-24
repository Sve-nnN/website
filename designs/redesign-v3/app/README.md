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
npm run verify:home
npm run verify:home:checks
npm run measure:home
npm run originals:verify -- --online
```

- `npm run dev` levanta el servidor de desarrollo en el puerto 5173.
- `npm run build` ejecuta `tsc` estricto y el build de producción en `dist/`.
- `npm run preview` sirve ese build en el puerto 4173.
- `npm run verify` corre el harness de Playwright (tracer, gallery, report y readme). Necesita `dist/`.
- `npm run measure` construye, mide pesos y corre 12 corridas de Lighthouse. Tarda entre 5 y 10 minutos.
- `npm run verify:home` comprueba las reglas del diseño de la home, el cupo de efectos y el presupuesto sobre `dist/`.
- `npm run verify:home:checks` corre el harness por etapas de la home (i18n, copy, accesibilidad, presupuesto y aislamiento).
- `npm run measure:home` corre Lighthouse sobre la home (3 corridas por combinacion, mediana) y escribe en `designs/redesign-v3/reports/home-v4/`.
- `npm run originals:verify -- --online` vuelve a comprobar los hashes de los originales contra el registro.

## Direcciones

Servidor de desarrollo (`npm run dev`, puerto 5173) y build servido (`npm run preview`, puerto 4173):

- Home v4 en español: `/` (por defecto papel-bosque)
- Home v4 en inglés: `/en`
- Otra paleta de prueba: `/?paleta=papel-tomate`, `tinta-fosforo`, `noche-menta`, `papel-cobalto`, `tinta-ambar` o `papel-bosque`
- Vista de testimonios: `/?testimonios=1`, `3` u `8`; el selector de paletas vuelve con `?selector=1`

Direcciones exactas de la galeria y el informe de la fase 51.1, en desarrollo y en el build servido:

- `http://127.0.0.1:5173/system` (dev): la galeria de originales de la fase 51.1.
- `http://127.0.0.1:5173/rendimiento` (dev): el informe de pesos y medianas.
- `http://127.0.0.1:4173/system` (build): la misma galeria sobre `dist/`.
- `http://127.0.0.1:4173/system?mount=grainient` (build): un original montado en produccion.
- `http://127.0.0.1:4173/rendimiento` (build): el mismo informe sobre `dist/`.

Estas dos vistas (`/system` y `/rendimiento`) siguen igual que en la fase 51.1 y no forman parte de la home v4.

## La home v4

Es el diseño aprobado `designs/redesign-v4/c-manual` portado a React: componentes por sección en `src/home/sections/`,
copy ES/EN en `src/home/copy/*.json`, tokens y paletas en `src/home/styles/tokens.css` y sprite Lucide en `src/home/icons.ts`.
Es una app CSR: el H1 no viene en el HTML crudo y `index.html` lleva un aviso `noscript`.
Los originales de React Bits viven en `src/home/fx/index.tsx` (solo props, todos con `React.lazy`).
`npm run verify:home` comprueba las reglas del diseño y el cupo de efectos sobre `dist/`, y `npm run measure:home` corre Lighthouse (3 corridas, mediana) y escribe en `designs/redesign-v3/reports/home-v4/`.

## Qué abrir

1. Ejecuta `npm install` y `npm run dev`, y abre `/system`.
2. En cada tarjeta, pulsa "Montar original" y compara el componente con el fallback CSS que ves antes de montarlo.
3. Con un original montado, pulsa "Pausar animaciones": el original se desmonta y la pausa sigue después de recargar.
4. Activa "Reducir movimiento" en el sistema (Ajustes del Sistema, Accesibilidad, Pantalla) y recarga: solo ves el fallback y un aviso con el motivo.
5. Ejecuta `npm run build` y `npm run preview`, y abre `/system?mount=grainient` para ver un original montado en el build de producción.
6. Abre `/rendimiento` y revisa el peso de cada original contra el porte vanilla y las medianas de Lighthouse.
7. Elige cuáles originales pasan a las páginas de las fases 52 a 55.
8. Confirma la política de no versionar los originales que describe `LICENSES.md`.
9. Revisa la home v4 para el gate de la fase 52: abre `/` y `/en` en desarrollo y en el build servido, en escritorio y en móvil.
10. Abre `designs/redesign-v3/reports/home/REPORT.md` para ver el detalle de la medición final, los supuestos y los pendientes.
11. Corre `npm run verify:home:checks -- --stage=all --final-shots --json=designs/redesign-v3/reports/home/home-checks.json` y revisa las capturas `final-es-desktop.jpg`, `final-es-mobile.jpg`, `final-en-desktop.jpg` y `final-en-mobile.jpg`.
12. Da tu decisión en el gate: `approve`, `approve-with-notes` o `changes` (con notas numeradas).

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
