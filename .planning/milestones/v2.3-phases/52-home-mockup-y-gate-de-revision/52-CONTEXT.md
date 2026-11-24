# Phase 52: Home mockup y gate de revisión - Context

**Gathered:** 2026-10-15
**Status:** Ready for planning
**Mode:** `--auto` (decisiones derivadas de lo que Juan ya fijó en la sesión; sin ronda interactiva)

<domain>
## Phase Boundary

Entregar la home completa como mockup navegable en la app React de la fase 51.1 (`designs/redesign-v3/app/`), con los componentes originales de React Bits, en EN y ES, dentro del presupuesto de performance y accesibilidad. Termina en un gate humano: Juan aprueba o da feedback. Las fases 53 a 55 no empiezan sin su aprobación explícita. No toca `src/`, el `package.json` raíz, lockfiles, Payload, colecciones, schema ni base de datos.

</domain>

<decisions>
## Implementation Decisions

### Dónde vive la home
- **D-01:** La home es una ruta nueva (`/`) de la app Vite + React + TS de `designs/redesign-v3/app/`, junto a `/system` y `/rendimiento`. Reutiliza `tokens.css` y los componentes de la fase 51 como base de estilo. Juan la ve con `npm run dev`.
- **D-02:** Los criterios dicen "home.html". Se cumple con una build estática de producción de la app (`npm run build`) más la ruta `/`; no se mantiene un HTML aparte.

### Contenido
- **D-03:** Secciones: hero, servicios, case studies, websites, about, testimonios, FAQ, contacto (las actuales del sitio).
- **D-04:** El copy sale del sitio actual (código y contenido ya en el repo o en el sitio vivo, solo lectura) y se reescribe según `research/voice-and-tone-juan.md`: habla Juan en primera persona, sin agencia, encabezados sin puntos ni comas, sin em dash, sin voz pasiva, sin voseo.
- **D-05:** Cero cifras, clientes o credenciales inventadas. Lo que falte aparece visible como pendiente (`[PENDIENTE: ...]`). Sin precios salvo lo ya fijado en memoria (auditoría de 600 USD acreditables, solo si el brief de la home lo exige).
- **D-06:** Paridad EN/ES con alternador en el mockup. Metas y títulos según la guía: keyword al inicio, sin puntos ni comas, máx 60 caracteres, formato `Tema | Juan Carlos Angulo`.
- **D-07:** Las preguntas abiertas de voz (tuteo, FAQ con `¿?`, separador `|`, microcopy terminal) toman el valor por defecto de la guía y se marcan como supuestos revisables en el gate.

### Efectos y rendimiento
- **D-08:** Máximo 2 efectos WebGL/canvas por página y 1 activo a la vez, con el cupo único de la galería. Propuesta inicial: Grainient en el hero, CRTWarp o GradientASCII en un bloque de detalle. El resto, CSS o SVG con los fallbacks de la fase 51.
- **D-09:** Carga diferida tras LCP, solo en viewport, pausa al salir, fallback estático en mobile, `prefers-reduced-motion` y `saveData`, botón "Pausar animaciones" visible.
- **D-10:** FAQ y superficies de lectura sin shaders. Texto nunca directo sobre gradiente (scrim o panel sólido).
- **D-11:** Lighthouse mobile guardado en `designs/redesign-v3/reports/`: performance >= 90 (mediana de 3), CLS 0, LCP < 2.0 s. El TBT con WebGL por software se reporta aparte y se marca para confirmar en GPU real.

### Accesibilidad
- **D-12:** Cumple `A11Y.md` y WCAG 2.2 AA: un solo H1 real en HTML, landmarks, foco visible, objetivos táctiles, ASCII `<pre aria-hidden>`, botón de pausa con etiqueta fija y `aria-pressed`.
- **D-13:** Declarar favicon (el sistema respondía 404) y `lang` correcto por idioma.

### Gate humano
- **D-14:** Al terminar la ejecución, la fase queda en `human_needed`: Juan revisa, el feedback se aplica y se re-presenta dentro de la fase. No se avanza a 53 sin su aprobación explícita.

### Claude's Discretion
- Maquetación exacta de cada sección, orden de los efectos, estructura de componentes y rutas, siempre dentro de los tokens y reglas anteriores.

</decisions>

<canonical_refs>
## Canonical References

- `.planning/ROADMAP.md` (Phase 52), `.planning/REQUIREMENTS.md` (HOME-01..04, PERF-01..04)
- `research/voice-and-tone-juan.md` y `research/voice-sample-juan.md`
- `designs/redesign-v3/README.md`, `designs/redesign-v3/assets/css/tokens.css`, `designs/redesign-v3/app/README.md`, `designs/redesign-v3/app/LICENSES.md`
- `.planning/phases/51-sistema-visual/51-VERIFICATION.md`, `.planning/phases/51.1-*/51.1-0{1,2}-SUMMARY.md`
- `research/serp-intent-home-description.md`, `research/JUAN-PROFILE.md`
- Memoria: brief de la home (bloque central = fixes del repo público, nunca código recreado)

</canonical_refs>

<deferred>
## Deferred Ideas

- Servicios, landings locales, blog, case studies y demás páginas: fases 53 a 55, tras el gate.
- Implementación en Payload: milestone posterior.

</deferred>
