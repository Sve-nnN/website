---
name: Juan Carlos Angulo — juan-tech.com
description: Consola nocturna de ingeniería: navy casi negro, brasa de señal escasa, tipografía que trabaja.
colors:
  ember: "#F7581E"
  ember-lift: "#FF7A45"
  ember-text: "#D03D07"
  navy-ink: "#12141C"
  navy-surface: "#1B1E29"
  navy-raised: "#23283A"
  navy-veil: "#1F2230"
  near-black: "#0A0A0F"
  paper: "#FAFAF7"
  quiet-ink: "oklch(0.54 0 0)"
  quiet-paper: "#A8ACBB"
  hairline: "oklch(0.63 0 0)"
  alarm: "#DC2626"
  alarm-lift: "#F87171"
typography:
  display:
    fontFamily: "Array, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 1.4rem + 4vw, 3.5rem)"
    fontWeight: 600
    lineHeight: 1.05
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Khand, Arial Narrow, system-ui, sans-serif"
    fontSize: "clamp(1.375rem, 1.1rem + 1.2vw, 1.75rem)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  mono:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.navy-ink}"
  button-secondary:
    backgroundColor: "{colors.navy-ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  button-ghost:
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "36px"
  badge-default:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.sm}"
    padding: "2px 10px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
  input:
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
  nav-link:
    textColor: "{colors.paper}"
    typography: "{typography.label}"
---

# Design System: Juan Carlos Angulo — juan-tech.com

## Overview

**Creative North Star: "The Console at Night"**

El sistema trabaja sobre una superficie de navy casi negro (#12141C), del mismo modo que un ingeniero trabaja sobre una consola a las dos de la mañana: fondo apagado, atención sostenida, y una sola señal cálida que se enciende cuando algo importa. La brasa (#F7581E en claro, #FF7A45 en oscuro) es esa señal. No decora la pantalla: la marca. Todo lo demás — texto, superficies, bordes — se mantiene en la familia navy/papel para que la brasa nunca compita con nada.

La densidad es la de una herramienta, no la de una landing. Contenedor de 1152px máximo, ritmo vertical constante de 48px que sube a 64px en desktop, tipografía de cuatro tamaños y nada más. La geometría es contenida: radio base de 8px, cards de 16px, badges de 4px porque leen más filosos que los botones a propósito. El movimiento es corto y con propósito: 150ms para respuesta a estado, curva `cubic-bezier(0.22, 1, 0.36, 1)` que llega rápido y frena suave, y un `active:scale-[0.98]` en botones que hace que la interfaz responda al dedo antes de responder al servidor.

El sitio es el portafolio de alguien que corrige SEO a nivel de código, así que la ejecución visual tiene que sostener ese argumento sin declararlo. Eso descarta tres mundos completos: la plantilla de agencia SEO (gradientes morados, mockups de stock, badges de "certificado"), la landing SaaS genérica (hero centrado con blob, tres tarjetas de feature con icono, logos en gris) y el portfolio de dev con dark mode neón (terminal falsa, verde fosforescente, glitch, tipeo animado). Los tres son ruido que dice "sé de esto" en vez de mostrarlo.

**Key Characteristics:**
- Navy casi negro como superficie de trabajo, papel cálido (#FAFAF7) como respiro de lectura
- Una sola señal de color, usada con avaricia
- Cuatro tamaños tipográficos. No hay un quinto
- Superficies planas en reposo; la sombra es feedback, no adorno
- Contraste verificado contra WCAG AA en cada par de tokens, no asumido
- Movimiento corto, con freno suave, y desactivable por `prefers-reduced-motion`

## Colors

Paleta de dos temperaturas: una familia navy fría que va del casi negro al gris azulado, y una única brasa cálida que solo aparece donde hay una decisión que tomar o un resultado que mostrar.

### Primary

- **Signal Ember** (#F7581E claro / #FF7A45 oscuro): la señal. CTA primario, borde inferior de los heroes de listado, badge de ciudad en las landings locales, punto de acento en gráficos. Está calibrado para funcionar **como fondo** con texto navy encima, no como color de texto sobre superficie clara.
- **Ember Text** (#D03D07 claro / #FF7A45 oscuro): la misma brasa oscurecida hasta 4.61:1 sobre `card`, exclusivamente para texto de énfasis directo sobre fondo claro — la métrica destacada de una CaseStudyCard, el valor de timeline de ServiceScopeCard. En tema oscuro reutiliza el primary sin cambio, porque ya pasa AA (6.42:1).

### Secondary

- **Navy Ink** (#12141C): texto principal en claro, fondo base en oscuro, y color de las bandas oscuras que estructuran la página (header, footer, hero). Es el token que hace de tinta y de mesa según el tema.
- **Navy Surface** (#1B1E29): superficie elevada en tema oscuro (cards, popovers).
- **Navy Raised** (#23283A): segundo escalón de elevación tonal en oscuro; también el fondo de hover utilitario.
- **Near Black** (#0A0A0F): exclusivo del shader del hero de home. Deliberadamente más oscuro que `navy-ink` para que la cinta de brasa tenga fondo real contra el que brillar, sin caer en negro puro que perdería la identidad navy.

### Neutral

- **Warm Paper** (#FAFAF7): fondo base en claro y color de texto sobre cualquier banda navy. Es blanco roto, con un punto de calidez que evita la frialdad de laboratorio del #FFFFFF.
- **Quiet Ink** (oklch(0.54 0 0) claro / #A8ACBB oscuro): texto secundario, metadatos, fechas, labels de eje. Nunca lleva información que el visitante necesite para decidir.
- **Hairline** (oklch(0.63 0 0) claro / rgba(250,250,247,0.35) oscuro): bordes y separadores. Oscurecido respecto al default de shadcn justamente para pasar AA como borde perceptible.

### Tertiary

- **Alarm** (#DC2626 claro / #F87171 oscuro): error y estado destructivo. Lleva texto navy encima (`primary-foreground`), no blanco.

### Named Rules

**The One Signal Rule.** La brasa ocupa ≤10% de cualquier pantalla. Un CTA primario por vista, una métrica destacada por tarjeta, un borde de acento por hero. Si dos elementos de la brasa compiten en el mismo viewport, uno de los dos está mal asignado. Su rareza es lo que la vuelve señal.

**The Ember-Never-Reads Rule.** `ember` (#F7581E) nunca se usa como color de texto sobre superficie clara: da 3.15:1 y falla AA. Para texto de énfasis sobre claro existe `ember-text` (#D03D07). Un `text-primary` sobre `bg-background` en tema claro es un bug de contraste, no una decisión estética.

**The Two-Temperature Rule.** La paleta tiene exactamente dos temperaturas: navy frío y brasa cálida. No entran terceros hues. Un verde de "éxito" o un azul de "info" romperían el sistema; el estado se comunica con jerarquía y copy, no con un color nuevo.

## Typography

**Display Font:** Array (con Arial Narrow, system-ui, sans-serif)
**Heading Font:** Khand (con Arial Narrow, system-ui, sans-serif)
**Body Font:** Geist Sans (con system-ui, sans-serif)
**Mono Font:** Geist Mono

**Character:** Array es condensada y geométrica, y marca los titulares de portada: la home y el h1 de cada página de detalle. Khand hereda esa verticalidad condensada y la lleva al resto de la jerarquía de títulos, así que la voz se sostiene sin repetir el gesto en cada subtítulo. Geist Sans hace todo lo que se lee de corrido: neutral, alta legibilidad en pantalla, sin personalidad que compita. El resultado es una voz que arranca con una afirmación fuerte y después se calla para dejar leer.

### Hierarchy

- **Display** (Array, 600, clamp 36px → 56px, line-height 1.05, tracking -0.025em): el h1 de una pieza que se presenta a sí misma — el hero de home y el titular de cada página de detalle (case study, post, website). No baja a títulos de sección.
- **Headline** (Khand, 600, clamp 22px → 28px, line-height 1.2, tracking -0.025em): todo lo demás que sea título — heroes de plantilla, títulos de sección, títulos de card, nombre en el header.
- **Body** (Geist Sans, 400, 16px, line-height 1.5): prosa, descripciones, contenido de rich text. Medida de lectura objetivo 65–75ch.
- **Label** (Geist Sans, 600, 14px, line-height 1.4): navegación, botones, badges, metadatos, etiquetas de KPI.
- **Mono** (Geist Mono, 400, 14px): bloques de código y valores técnicos donde el ancho fijo aporta lectura.

### Named Rules

**The Four Sizes Rule.** El sistema tiene exactamente cuatro tamaños: `display`, `heading`, `body`, `label`. Cada uno viene con su line-height y su weight pegados en el token. Un `text-2xl` suelto o un `text-[19px]` arbitrario está saliéndose del sistema; si un nivel de jerarquía nuevo hace falta de verdad, se agrega al token, no a la clase.

**The Array Is For Titles Rule.** Array marca el h1 de una pieza que se presenta a sí misma: el hero de home y el titular de cada página de detalle. Nunca baja a un título de sección, a un título de card ni a un subtítulo — ahí manda Khand. La escasez es de nivel, no de página: un solo Array por vista.

**The Faux-Bold Debt.** `Array-Regular.woff2` es el único peso instalado (400), pero el token `display` pide 600 — el navegador está sintetizando el bold. Es deuda visual conocida: al tocar el display, o se instala un peso real de Array o se baja el token a 400. No se resuelve engordando el tracking.

## Layout

Columna única centrada con `max-w-6xl` (1152px), padding horizontal de 16px en mobile y 24px desde `md` (768px). Todo bloque de contenido pasa por el mismo componente `Container`, así que la alineación del sitio es una sola decisión y no se re-litiga por sección.

El ritmo vertical es constante y corto de vocabulario: 48px de padding vertical por sección (`py-12`), que sube a 64px (`md:py-16`) en desktop. Los heroes tienen su propio escalón por variante — 64→96px en home, 40→56px en listados, 56→80px en landings locales — porque el hero es lo único que tiene derecho a más aire que el resto.

La escala de espaciado es múltiplo de 4 sin excepciones: 4 / 8 / 16 / 24 / 32 / 48 / 64. Los gaps de grilla se quedan en 16, 24 y 32.

Responsive: la navegación colapsa a un `Sheet` lateral por debajo de `md`; las grillas de tarjetas van de una columna a dos o tres en `md`; los charts de resultados reflow antes que hacer scroll horizontal. El breakpoint `md` (768px) hace casi todo el trabajo — el sistema no multiplica puntos de quiebre por deporte.

### Named Rules

**The One Container Rule.** Ninguna sección define su propio ancho máximo ni su propio padding horizontal. Si algo necesita sangrar a ancho completo (un fondo, un shader), el fondo se va full-bleed pero el contenido sigue viviendo dentro del `Container`.

## Elevation & Depth

El sistema es casi plano en reposo y usa la sombra como respuesta, no como decoración. Las cards descansan en `shadow-sm` — apenas un asentamiento de 1px que las despega del fondo — y suben a `shadow-md` solo en hover, con transición de 250ms. La profundidad, entonces, es feedback: si algo tiene sombra pronunciada, es porque el visitante lo está tocando.

En tema oscuro la jerarquía la lleva sobre todo el tono, no la sombra: `background` (#12141C) → `card` (#1B1E29) → `raised` (#23283A) forman una escalera de tres peldaños que funciona donde las sombras negras sobre navy no se verían.

### Shadow Vocabulary

- **Asentamiento** (`0 1px 2px 0 hsl(220 20% 10% / 0.05)`): estado de reposo de cards, botones e inputs. Casi imperceptible a propósito.
- **Respuesta** (`0 4px 6px -1px hsl(220 20% 10% / 0.1), 0 2px 4px -2px hsl(220 20% 10% / 0.1)`): hover de cualquier superficie interactiva.
- **Flotante** (`0 10px 15px -3px hsl(220 20% 10% / 0.1), 0 4px 6px -4px hsl(220 20% 10% / 0.1)`): elementos que sí se despegan del plano — sheets, popovers, dropdowns.
- **Foco** (`0 0 0 3px rgba(255, 91, 31, 0.45)`): anillo de foco en brasa translúcida. Acompaña siempre al `ring` de 1px, nunca lo reemplaza.

### Named Rules

**The Shadow-Is-Feedback Rule.** Una superficie sube de sombra únicamente por interacción del visitante (hover, foco) o porque flota de verdad sobre el resto del documento (sheet, popover). Una card que ya nace en `shadow-lg` está gritando sin que nadie la haya tocado.

## Shapes

Lenguaje de esquinas escalonado y deliberado, con `--radius: 8px` como raíz de la que todo lo demás se deriva:

- **4px** (`rounded-sm`) en badges. Leen más filosos que los botones a propósito: son etiquetas de dato, no elementos accionables.
- **6px** (`rounded-md`) en botones e inputs. Es el radio del elemento que se toca.
- **8px** (`rounded-lg`) como radio base para contenedores menores.
- **16px** (`rounded-2xl`) en cards y en el bloque CallToAction. Es el único radio grande del sistema y marca "esto es una superficie de contenido completa".
- **Pill** (`rounded-full`) solo en el badge de estado del hero y en avatares.

Los bordes son de 1px y color `hairline`, salvo un caso estructural: el hero de listado lleva `border-b-4` en brasa, que funciona como subrayado de sección más que como borde.

### Named Rules

**The Radius Ladder Rule.** El radio comunica escala: cuanto más grande la superficie, más grande la esquina. Un badge con radio de card, o una card con radio de botón, rompe la lectura de jerarquía. No existen radios fuera de la escalera 4 / 6 / 8 / 16 / full.

## Components

Carácter general: **preciso y responsivo al tacto**. Geometría contenida, transiciones de 150ms, feedback inmediato. Se tiene que sentir como una herramienta bien calibrada, no como una página de marketing.

### Buttons

- **Shape:** esquinas suaves de 6px (`rounded-md`), altura 36px por defecto (32px en `sm`, 40px en `lg`), botón de icono cuadrado de 36px.
- **Primary:** fondo brasa con texto navy (#12141C), padding 8px/16px, `shadow-sm` en reposo.
- **Hover / Focus:** el fondo baja a 90% de opacidad y la sombra sube a `shadow-md`. `active:scale-[0.98]` da el hundido táctil. El foco combina `ring-1` en `ring` con el `shadow-focus` en brasa translúcida; la transición corre a 150ms con `ease-out`.
- **Secondary:** fondo navy con texto papel, hover a 80%.
- **Outline:** borde `input`, fondo `background`, hover a fondo `accent`.
- **Ghost:** sin fondo hasta el hover. Es el botón de la navegación y de las acciones terciarias.
- **Link:** texto en brasa con subrayado que aparece en hover, offset de 4px.

### Chips / Badges

- **Style:** radio de 4px, padding 2px/10px, texto de 12px en weight 600, borde transparente en las variantes rellenas.
- **State:** `default` es brasa con texto navy; `secondary` es navy con texto papel; `outline` es solo texto con el borde visible. Los badges no son interactivos salvo que se los use como filtro.

### Cards / Containers

- **Corner Style:** 16px (`rounded-2xl`).
- **Background:** `card`, que en claro coincide con el fondo de página y en oscuro se separa a #1B1E29.
- **Shadow Strategy:** `shadow-sm` en reposo, `shadow-md` en hover, 250ms con `ease-standard`. Ver Elevation & Depth.
- **Border:** 1px en `hairline`. En tema claro, donde card y fondo comparten color, el borde es lo único que define la superficie — no se puede quitar.
- **Internal Padding:** 24px (`p-6`).

### Inputs / Fields

- **Style:** altura 36px, fondo transparente, borde 1px en `input`, radio 6px, texto de 16px en mobile que baja a 14px desde `md` (evita el zoom automático de iOS).
- **Focus:** `ring-1` más `shadow-focus` en brasa translúcida, transición de 150ms.
- **Disabled:** cursor bloqueado y opacidad 50%.
- **Placeholder:** `quiet-ink`. Nunca lleva información que reemplace al label.

### Navigation

- Header sticky con banda navy y texto papel, `Container` con 16px de padding vertical, nombre en Khand a tamaño `heading`.
- Enlaces en `label` (14px/600), gap de 32px, hover que cambia color sin subrayado.
- Por debajo de `md`: botón de icono `outline` de 40px que abre un `Sheet` lateral, con los enlaces apilados, un `Separator` a 30% de opacidad y el selector de idioma abajo.

### Signature: Hero Grain Shader

El hero de home reemplaza el fondo sólido por un shader `GrainGradient` (`@paper-design/shaders-react`) con forma `blob`, animado por tiempo, sobre `near-black` (#0A0A0F) — una superficie granulada casi negra donde una brasa apenas se insinúa. Los colores están fijados como constantes derivadas de los tokens (#23283A, #3A4159, #F7581E en claro), no re-derivadas en runtime.

Dos decisiones son registro histórico y no se reabren sin motivo nuevo: la reactividad al mouse se prototipó y se rechazó tras probarla en vivo (queda solo la animación por tiempo), y la forma `ripple` se comparó contra `blob` con capturas y perdió por ser demasiado gráfica. El shader respeta `prefers-reduced-motion` y tiene un error boundary con fallback sólido.

### Signature: Results Chart

Los case studies muestran un comparativo antes/después con recharts, alimentado por datos reales de Google Search Console. Paleta de gráfico en escala de grises en claro (`chart-1..5` de oklch 0.87 a 0.269) y navy escalonado en oscuro, con la brasa reservada a la serie principal. Métricas de escalas muy distintas no comparten eje: van a eje secundario o a charts separados.

## Do's and Don'ts

### Do:

- **Do** reservar la brasa para una sola decisión por viewport — el CTA primario, la métrica clave o el borde de acento, nunca los tres a la vez.
- **Do** usar `text-primary-text` (#D03D07) cuando la brasa tiene que ser texto sobre fondo claro, y `bg-primary` con `text-primary-foreground` cuando tiene que ser fondo.
- **Do** pasar todo contenido nuevo por `Container`, y dejar que solo los fondos sangren a ancho completo.
- **Do** mantener el ritmo vertical en `py-12 md:py-16` para secciones de contenido; los heroes son la única excepción y ya tienen su tabla de variantes.
- **Do** componer con los cuatro tamaños tipográficos existentes. Si ninguno encaja, la respuesta es revisar la jerarquía, no inventar un tamaño.
- **Do** verificar contraste real contra AA antes de introducir cualquier par de color nuevo. Este sistema ya tuvo dos rondas de corrección de contraste (Phase 11 y Phase 25); la deuda se paga una sola vez.
- **Do** dejar el borde de 1px en las cards de tema claro: sin él la superficie desaparece contra el fondo.
- **Do** respetar `prefers-reduced-motion` en cualquier animación nueva. Ya existe una red de seguridad global en `globals.css`; no la sortees con `!important`.

### Don't:

- **Don't** usar `ember` (#F7581E) como color de texto sobre superficie clara. Da 3.15:1 y falla AA.
- **Don't** introducir un tercer hue. No hay verde de éxito ni azul de información en este sistema: el estado se comunica con jerarquía y copy.
- **Don't** usar Array por debajo del h1: ni en títulos de sección, ni de card, ni en subtítulos.
- **Don't** dar sombra pronunciada a algo que nadie está tocando. La sombra en reposo es `shadow-sm` y nada más.
- **Don't** inventar radios fuera de la escalera 4 / 6 / 8 / 16 / full. En particular, `rounded-xl` (12px) es el default sin token de Tailwind y no pertenece a este sistema.
- **Don't** poner gradientes morados, mockups de stock, badges de certificación o contadores de vanidad: es el lenguaje de la plantilla de agencia SEO, la anti-referencia más cercana y más peligrosa.
- **Don't** caer en el hero centrado con blob más tres tarjetas de feature con icono más logos en gris. Esa es la landing SaaS genérica.
- **Don't** simular una terminal, texto verde fosforescente, glitch o animación de tipeo. Este sitio demuestra ingeniería con ejecución, no con cosplay.
- **Don't** agregar utilidades de Tailwind dentro de `src/blocks/**` asumiendo que compilan sin verificar el `content` glob — ya hubo un bug real de purga silenciosa por esto.
