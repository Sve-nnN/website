# Licencias de la app de mockups

Este documento cubre los componentes originales de React Bits que usa `designs/redesign-v3/app/` y los paquetes npm que la app instala. Esto no es asesoría legal: es la lectura que hace el equipo de la licencia, para decidir con información.

## 1. Origen y licencia de React Bits

- Proyecto: React Bits, de David Haz (`https://github.com/DavidHDev/react-bits`).
- Registro de componentes: `https://reactbits.dev/r/<Nombre>-TS-CSS.json` (variante TypeScript con CSS).
- Licencia: MIT + Commons Clause License Condition v1.0.
- Titular: Copyright (c) 2026 David Haz.
- Texto descargado de `https://raw.githubusercontent.com/DavidHDev/react-bits/main/LICENSE.md` el 2026-10-15 (hora local).
- sha256 del texto descargado: `f4c33af6739191537738662d223b68d77bc226f4b57ea883e16481d8cc5c73c9`.

Texto verbatim:

```text
MIT + Commons Clause License Condition v1.0

Copyright (c) 2026 David Haz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, and distribute the Software **as part of an application, website, or product**, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

## Commons Clause Restriction

You may use this Software, including for any commercial purpose, **so long as you do not sell, sublicense, or redistribute the components themselves-whether alone, in a bundle, or as a ported version.**

## No Warranty

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 2. Qué dice la cláusula en palabras simples

- Permitido: usar los componentes como parte de una aplicación, un sitio o un producto, incluso con fines comerciales. Un portfolio personal entra en ese uso.
- Permitido: modificar los componentes para esa aplicación, sitio o producto.
- Prohibido: vender los componentes solos, sublicenciarlos o redistribuirlos, ya sea sueltos, en un paquete o como versión portada.
- Obligatorio: conservar el aviso de copyright y el texto del permiso en todas las copias.

## 3. Cómo trata este repositorio los originales

- Los originales se instalan desde el registro con `scripts/install-reactbits.mjs`. Ese script antepone una cabecera `@reactbits-origin` con el nombre, la URL de registro, el sha256 del cuerpo y la licencia. El cuerpo del archivo queda idéntico al del registro.
- El registro no trae cabecera ni aviso de licencia en los archivos. La cabecera de origen la agrega el instalador.
- `reactbits.manifest.json` fija el sha256 del cuerpo de cada archivo. El instalador falla si el registro cambia los bytes y pide revisar el diff y repetir con `--update`.
- Los originales **no se versionan**. El repositorio es público y la Commons Clause prohíbe redistribuir los componentes. El `.gitignore` local de la app excluye `src/components/reactbits/`.
- Se reproducen con `npm install` dentro de `designs/redesign-v3/app/`: el `postinstall` ejecuta el instalador en modo locked y reconstruye los 16 archivos con los mismos hashes.
- `node scripts/verify-originals.mjs --online` comprueba cabeceras, hashes, licencia, dependencias, carga diferida y aislamiento, y compara cada cuerpo con el registro vivo.

## 4. Qué decidir antes de publicar o de llevarlos a Next.js más Payload

1. Versionar o no los originales. Hoy no se versionan. Para versionarlos hay que quitar de `designs/redesign-v3/app/.gitignore` la línea `src/components/reactbits/`. Publicar los archivos en un repositorio público equivale a redistribuirlos, así que conviene decidirlo con calma: retirar una publicación después no es posible.
2. Llevarlos al proyecto Next.js más Payload. El uso dentro del sitio de Juan encaja en "parte de una aplicación o sitio". Si el repositorio de ese proyecto es público, aplica la misma decisión del punto 1.
3. Conservar el aviso de copyright y el texto del permiso en el repositorio y, si se distribuye el sitio, en un archivo de avisos accesible.
4. Esto no es asesoría legal. Si el repositorio es público o el sitio se vuelve parte de un producto que se entrega a terceros, consulta a un abogado.

## 5. Componentes instalados (16)

| Componente | URL de registro | Variante | Archivos | Dependencias |
|------------|-----------------|----------|----------|--------------|
| Grainient | https://reactbits.dev/r/Grainient-TS-CSS.json | TS-CSS | `Grainient.css`, `Grainient.tsx` | ninguna |
| PatternWaves | https://reactbits.dev/r/PatternWaves-TS-CSS.json | TS-CSS | `PatternWaves.css`, `PatternWaves.tsx` | `ogl@^1.0.11` |
| CRTWarp | https://reactbits.dev/r/CRTWarp-TS-CSS.json | TS-CSS | `CRTWarp.css`, `CRTWarp.tsx` | ninguna |
| MicroSlats | https://reactbits.dev/r/MicroSlats-TS-CSS.json | TS-CSS | `MicroSlats.css`, `MicroSlats.tsx` | `ogl@^1.0.11` |
| PixelBlast | https://reactbits.dev/r/PixelBlast-TS-CSS.json | TS-CSS | `PixelBlast.css`, `PixelBlast.tsx` | ninguna |
| PixelCard | https://reactbits.dev/r/PixelCard-TS-CSS.json | TS-CSS | `PixelCard.css`, `PixelCard.tsx` | ninguna |
| GradientASCII | https://reactbits.dev/r/GradientASCII-TS-CSS.json | TS-CSS | `GradientASCII.css`, `GradientASCII.tsx` | ninguna |
| ASCIIText | https://reactbits.dev/r/ASCIIText-TS-CSS.json | TS-CSS | `ASCIIText.tsx` | ninguna |
| Noise | https://reactbits.dev/r/Noise-TS-CSS.json | TS-CSS | `Noise.css`, `Noise.tsx` | ninguna |
| Dither | https://reactbits.dev/r/Dither-TS-CSS.json | TS-CSS | `Dither.css`, `Dither.tsx` | ninguna |
| HalftoneReveal | https://reactbits.dev/r/HalftoneReveal-TS-CSS.json | TS-CSS | `HalftoneReveal.css`, `HalftoneReveal.tsx` | ninguna |
| PixelTransition | https://reactbits.dev/r/PixelTransition-TS-CSS.json | TS-CSS | `PixelTransition.css`, `PixelTransition.tsx` | ninguna |
| FaultyTerminal | https://reactbits.dev/r/FaultyTerminal-TS-CSS.json | TS-CSS | `FaultyTerminal.css`, `FaultyTerminal.tsx` | ninguna |
| SpotlightCard | https://reactbits.dev/r/SpotlightCard-TS-CSS.json | TS-CSS | `SpotlightCard.css`, `SpotlightCard.tsx` | ninguna |
| GradientBlinds | https://reactbits.dev/r/GradientBlinds-TS-CSS.json | TS-CSS | `GradientBlinds.css`, `GradientBlinds.tsx` | ninguna |
| StarBorder | https://reactbits.dev/r/StarBorder-TS-CSS.json | TS-CSS | `StarBorder.css`, `StarBorder.tsx` | ninguna |

Ningún componente trae `three`, `gsap` ni `motion`. Solo PatternWaves y MicroSlats piden `ogl`.

## 6. Paquetes npm de la app

Versiones resueltas en `package-lock.json` el 2026-10-15.

| Paquete | Versión | Licencia | Uso |
|---------|---------|----------|-----|
| react | 19.3.1 | MIT | Runtime de la interfaz |
| react-dom | 19.3.1 | MIT | Render en el navegador |
| ogl | 1.0.11 | Unlicense | WebGL para PatternWaves y MicroSlats |
| vite | 8.3.4 | MIT | Servidor de desarrollo y build |
| @vitejs/plugin-react | 6.1.2 | MIT | Plugin de React para Vite |
| typescript | 7.0.2 | Apache-2.0 | Chequeo de tipos |
| @types/react | 19.3.0 | MIT | Tipos |
| @types/react-dom | 19.3.0 | MIT | Tipos |
| @types/node | 26.6.5 | MIT | Tipos para la config de Vite |

Los paquetes transitivos que instala npm (Rolldown, Lightning CSS, PostCSS y similares) traen su licencia en `node_modules/` y no se redistribuyen desde este repositorio.

## 7. Aviso final

Esto no es asesoría legal.
