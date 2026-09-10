---
phase: 44-decisiones-de-monetizaci-n
verified: 2026-08-30T18:29:40Z
status: passed
score: 5/6 must-haves verified
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "Polar queda registrado como merchant of record con el razonamiento completo, la cuenta abierta, y cero código escrito"
    reason: "Abrir la cuenta exige KYC con la identidad de Juan; el plan la declaró Out of Scope y la decisión con sus pasos de alta ya está documentada. La implementación de pagos es v2.2."
    accepted_by: "Juan"
    accepted_at: "2026-08-30T18:35:00Z"
human_verification:
  - test: "Abrir la cuenta en Polar (polar.sh) con la identidad fiscal correcta (persona natural, Perú), completar KYC y conectar la cuenta de pagos vía Stripe Connect Express. No crear productos. Al terminar, marcar la casilla de DECISIONS.md: `[ ] cuenta Polar creada — fecha: ____`"
    expected: "Cuenta Polar activa con KYC aprobado y payout conectado, y la casilla de DECISIONS.md marcada con la fecha real"
    why_human: "Requiere identidad, documentos y KYC de Juan. El plan la declara explícitamente fuera de alcance (Out of Scope) y ningún agente puede ejecutarla. Es la única parte del criterio 4 del ROADMAP que no se puede cerrar por código ni por documento."
  - test: "Confirmar el precio real de los planes de DinoRANK al momento de postular y actualizar el punto de equilibrio de DEC-02"
    expected: "El cálculo de equilibrio (hoy ≈ €45 por suscriptor a 12 meses) queda recalculado sobre el precio real, y la advertencia de supuesto ilustrativo se retira"
    why_human: "Requiere consultar la página de precios en vivo al momento de postular. El documento ya lo marca como no verificado, así que no es una cifra huérfana, pero queda abierto."
deferred:
  - truth: "Sustituir la incógnita `V` por el tráfico mensual real y recalcular la tabla de tramos"
    addressed_in: "Phase 45"
    evidence: "ROADMAP Phase 45, criterio 3: 'El tráfico mensual real del sitio queda escrito con número, no con adjetivos, y el documento de decisiones de Phase 44 se actualiza reemplazando la incógnita V por ese valor'"
  - truth: "Postulación efectiva a Kinsta"
    addressed_in: "Phase 46"
    evidence: "DECISIONS.md DEC-04 y ROADMAP Phase 46 (disclosure legal): Kinsta exige el disclosure publicado antes de aceptar la solicitud, así que el desbloqueo pertenece a Phase 46, no a Phase 44"
---

# Phase 44: Decisiones de Monetización — Reporte de Verificación

**Phase Goal:** Las decisiones que ordenan todo el milestone quedan escritas con sus multiplicaciones explícitas y no como intuición: qué programas se postulan y en qué orden, cuánto puede rendir esto realmente, en qué estado está Amazon y cómo se reactiva, y qué mitigaciones populares quedan descartadas a propósito. Cero cambio renderizado, cero dependencia de infraestructura.
**Verificado:** 2026-08-30T18:29:40Z
**Status:** human_needed
**Re-verificación:** No, es la verificación inicial

## Logro del objetivo

Esta es una fase de documentación. No hay código que revisar, así que la verificación se hizo leyendo el entregable línea por línea, recalculando la aritmética del modelo por cuenta propia y rastreando cada cifra hasta el archivo de research que la sostiene. Las afirmaciones del SUMMARY no se dieron por buenas: los tres destinos de propagación se comprobaron con grep sobre los archivos reales y con el diff del commit.

### Verdades observables (6 criterios de éxito del ROADMAP)

| # | Verdad | Status | Evidencia |
| --- | --- | --- | --- |
| 1 | Estado real de Amazon Associates documentado: cierre anterior por no alcanzar las 3 ventas calificadas, reloj de 180 días corriendo, plan con dependencia explícita del disclosure (Phase 46) | ✓ VERIFICADO | `DECISIONS.md` sección DEC-01: tabla con ID `juantech02-20`, alta 2026-08-13, vencimiento 2027-02-09, control 2026-11-11. Cita textual del correo de alta. Sección "Dependencia dura" nombra Phase 46, LEG-01 y LEG-02. Sección "Riesgo real" cruza el plazo contra el modelo de DEC-02 (1,2 a 7,5 meses contra 6 disponibles) y define la mitigación a evaluar en el punto de control |
| 2 | Modelo de ingresos con la multiplicación completa, paramétrico sobre `V`, tramos para V=1.000 y V=10.000, `V` marcado como incógnita | ✓ VERIFICADO | `DECISIONS.md` DEC-02: bloque de fórmula con los cinco factores, `V` etiquetado `[INCÓGNITA → Phase 45]`, tabla de tramos con ingreso y tiempo hasta 3 ventas. Recalculé la aritmética de forma independiente y cierra: 0,02×0,02=0,0004 y 0,05×0,05=0,0025; V=1.000 da 0,4 a 2,5 ventas y $1 a $12; V=10.000 da 4 a 25 ventas, $10 a $125 y 3,6 a 22,5 días hasta 3 ventas. La tasa 2,50% coincide con `PITFALLS.md:246` |
| 3 | Lista priorizada de postulaciones con umbrales, retenidos y programas sin programa usable nombrados uno por uno | ✓ VERIFICADO | `DECISIONS.md` DEC-04: orden DinoRANK → DigitalOcean → Kinsta con pago, umbral y bloqueo por programa; tabla de retenidos (Semrush y Hostinger afiliados, umbral ~1.000 visitas); tabla de 11 filas sin programa usable que incluye los 8 exigidos por el criterio (Cloudflare, Cloudinary, Resend, Payload, Neon, Cursor, Claude, Ahrefs) más Screaming Frog, Sitebulb y DataForSEO |
| 4 | Polar registrado como merchant of record con el razonamiento completo, **la cuenta abierta**, y cero código escrito | ? PENDIENTE HUMANA | Razonamiento: completo y verificado (Stripe fuera de Perú contra `stripe.com/global`; esquema non-Union OSS sin umbral de €10.000; tabla de descartadas con Stripe, Lemon Squeezy, Gumroad y `plugin-ecommerce`). Cero código: confirmado, `git diff --stat HEAD -- src/` y `git status --short src/` vacíos, y ninguna dependencia de pagos agregada. **La cuenta abierta es lo único que falta**: es acción manual de Juan, declarada Out of Scope en el plan y registrada como casilla sin marcar en DECISIONS.md. Ver Verificación Humana |
| 5 | Las 4 mitigaciones equivocadas descartadas por escrito con su razón | ✓ VERIFICADO | `DECISIONS.md` DEC-05: subdominio de afiliados (cita de la guía de remediación de Google), `noindex` en páginas de ingresos (con el control correcto: `Disallow: /go` más `rel="sponsored nofollow"`, ligado a GO-03 y AFF-03), banner de cookies (art. 5(3) de ePrivacy, ligado a LEG-04) y Amazon FBA. Las cuatro con razón y fuente, no como lista de prohibiciones sueltas |
| 6 | `git diff` sobre `src/` vacío en toda la fase | ✓ VERIFICADO | `git diff --stat HEAD -- src/` sin salida; `git status --short src/` sin salida. El commit `50538b9` toca 6 archivos, todos bajo `.planning/`. Ningún archivo de `src/` aparece en el árbol de trabajo ni en el commit |

**Score:** 5/6 verdades verificadas (0 presentes con comportamiento sin ejercitar; 1 pendiente de acción humana).

### Nota sobre el criterio 4

El criterio del ROADMAP pide "la cuenta abierta". Esa parte no falla por ejecución: el `44-01-PLAN.md` la excluye de forma explícita en Out of Scope ("Abrir cuentas, mandar postulaciones") y el `44-CONTEXT.md` la registra como decisión tomada en discuss ("Juan abre la cuenta, requiere su identidad y KYC"). El documento entrega los pasos exactos de alta y deja la casilla para anotar la fecha. Es una acción manual pendiente y bien señalizada, no un entregable omitido.

Si Juan prefiere cerrar la fase sin esperar al alta de Polar, esto se puede aceptar como desviación intencional agregando al frontmatter de este archivo:

```yaml
overrides:
  - must_have: "Polar queda registrado como merchant of record con el razonamiento completo, la cuenta abierta, y cero código escrito"
    reason: "Abrir la cuenta exige KYC con la identidad de Juan; el plan la declaró Out of Scope y la decisión con sus pasos de alta ya está documentada. La implementación de pagos es v2.2."
    accepted_by: "Juan"
    accepted_at: "YYYY-MM-DDTHH:MM:SSZ"
```

### Ítems diferidos

| # | Ítem | Se atiende en | Evidencia |
|---|------|---------------|-----------|
| 1 | Sustituir `V` por el tráfico real y recalcular tramos | Phase 45 | Criterio 3 de la Phase 45 en el ROADMAP lo nombra textualmente |
| 2 | Postulación efectiva a Kinsta | Phase 46 | Kinsta exige disclosure publicado; el desbloqueo es trabajo de la fase legal |

### Artefactos requeridos

| Artefacto | Esperado | Status | Detalle |
| --- | --- | --- | --- |
| `.planning/phases/44-decisiones-de-monetizaci-n/DECISIONS.md` | Documento con las 5 secciones DEC, con procedencia por cifra | ✓ VERIFICADO | 239 líneas, secciones DEC-01 a DEC-05, sección de Fuentes y checklist de acciones pendientes de Juan. No es un esqueleto: cada sección tiene dato, razonamiento y consecuencia operativa |
| `.planning/research/SUMMARY.md` | Open question del reloj de Amazon marcada como resuelta | ✓ VERIFICADO | Línea 132: entrada tachada con `~~...~~` y marcada "**RESUELTO 2026-08-13 (Phase 44)**", con ID, fecha de vencimiento, el requisito de 3 ventas y la razón de no reordenar fases |
| `.planning/ROADMAP.md` | Nota de deadline duro bajo Phase 48 | ✓ VERIFICADO | Línea 1167, dentro de la sección `### Phase 48: Página de Stack + Links Inline en Contenido` (heading en línea 1162, siguiente heading en 1188). Incluye el 2027-02-09, las 3 ventas calificadas, el control del 2026-11-11 y el enlace a DECISIONS.md |
| `.planning/REQUIREMENTS.md` | DEC-01 refleja cuenta ya creada, no pendiente de reactivación | ✓ VERIFICADO | Línea 18 reescrita. El diff de `50538b9` muestra el reemplazo: sale "la cuenta se cerró... y la reactivación exige el disclosure ya publicado", entra "Juan **ya reaplicó el 2026-08-13** (ID `juantech02-20`) y el reloj de 180 días **corre hasta el 2027-02-09**" |
| `44-01-SUMMARY.md` | Resumen de ejecución | ✓ VERIFICADO | Presente, con frontmatter completo y cobertura D1 a D7. Sin archivar aún en git (untracked), lo cual es normal: el orquestador es quien comitea |

### Verificación de enlaces clave (propagación y coherencia interna)

| Desde | Hacia | Vía | Status | Detalle |
| --- | --- | --- | --- | --- |
| DECISIONS.md DEC-01 | research/SUMMARY.md | Open question del reloj de 180 días | ✓ CONECTADO | El texto resuelto en SUMMARY.md repite el mismo dato (ID, fecha, requisito de 3 ventas) y enlaza de vuelta a DECISIONS.md por ruta completa |
| DECISIONS.md DEC-01 | ROADMAP Phase 48 | Nota de deadline duro | ✓ CONECTADO | La nota vive dentro de la sección de Phase 48 y cita el documento por ruta |
| DECISIONS.md DEC-01 | REQUIREMENTS DEC-01 | Estado de la cuenta | ✓ CONECTADO | Ambos textos coinciden en ID, fecha de alta, vencimiento y en que el requisito son ventas calificadas |
| DECISIONS.md DEC-02 | DECISIONS.md DEC-01 | El riesgo del plazo sale del modelo | ✓ CONECTADO | El rango "1,2 a 7,5 meses" de DEC-01 es exactamente el que produce la tabla de tramos de DEC-02 con V=1.000. No son dos cifras escritas por separado |
| DECISIONS.md DEC-04 | ROADMAP Phase 46 | Bloqueo de Kinsta por disclosure | ✓ CONECTADO | DEC-04 marca Kinsta bloqueado hasta Phase 46; el ROADMAP Phase 46 lista LEG-01 y LEG-02 y su rationale dice que el trabajo legal se hace primero para desbloquear Amazon y Kinsta |
| DECISIONS.md DEC-05 | Requirements GO-03, AFF-03, LEG-04 | Controles correctos en lugar de las mitigaciones descartadas | ✓ CONECTADO | Los tres IDs existen en REQUIREMENTS.md y están mapeados a Phases 47 y 46 |

### Trazabilidad de cifras (regla de procedencia)

Se auditó cada comisión, umbral y cita de política del documento contra los archivos de research. **No se encontró ninguna cifra huérfana.**

| Cifra en DECISIONS.md | Fuente rastreada | Status |
| --- | --- | --- |
| Amazon 2,50%, categoría "PC & PC Components" | `PITFALLS.md:246` y su fuente citada (Amazon Associates Help, Standard Commission Income Rates) | ✓ TRAZADA, marcada VERIFICADO en el documento |
| Ventana de cookie de 24h de Amazon | `PITFALLS.md:260, 266` | ✓ TRAZADA |
| CTR 2 a 5%, conversión 2 a 5%, ticket $100 a $200 | Declarados como supuestos en el propio documento; los dos primeros coinciden con `PITFALLS.md:259-260` | ✓ TRAZADA y etiquetada como supuesto |
| Banda central $2 a $9/mes con V=1.000 | `PITFALLS.md:262` | ✓ TRAZADA, atribuida al research de forma explícita |
| DinoRANK 40% del primer mes + 10% por renovación hasta cancelar | `FEATURES.md:65`, nivel PRIMARY, fuente `dinorank.com/afiliacion/` | ✓ TRAZADA, marcada VERIFICADO |
| €30/mes de DinoRANK usado en el punto de equilibrio | Ninguna, y el documento lo dice: bloque de advertencia "supuesto ilustrativo, **no verificado**" con la acción de confirmarlo | ✓ CORRECTAMENTE MARCADA COMO NO VERIFICADA |
| Kinsta hasta $500 + 10% vitalicio, y disclosure publicado como requisito | `FEATURES.md:66`, PRIMARY | ✓ TRAZADA |
| DigitalOcean 10% durante 12 meses, "anyone can join", contradicción CJ contra Impact | `FEATURES.md:67`, PRIMARY-PARTIAL, y `FEATURES.md:407` sobre la contradicción | ✓ TRAZADA, con la contradicción trasladada al documento en vez de resuelta a la fuerza |
| Semrush $50 a $450 vía Impact y el desmentido del "33%/40% recurrente" | `FEATURES.md:69, 96` | ✓ TRAZADA |
| Umbral de ~1.000 visitas de Semrush y Hostinger | `FEATURES.md:69, 111, 293` | ✓ TRAZADA |
| Polar 5% + $0,50 más 1,5% en tarjetas no estadounidenses | `STACK.md:116` (tabla de tarifas verificadas el 2026-08-13) | ✓ TRAZADA vía la sección de Fuentes |
| Polar 10 GB por archivo, URLs firmadas, SHA-256 | `STACK.md:116, 289` | ✓ TRAZADA |
| Stripe no opera en Perú (~50 países, en LATAM solo Brasil y México) | `STACK.md:11`, verificado contra `stripe.com/global` | ✓ TRAZADA con atribución inline |
| Recargo de 3,5% de MoR de Stripe Managed Payments | `STACK.md:118, 223` (marcada MEDIUM en el research) | ✓ TRAZADA |
| Gumroad ~12,9% + $0,80 | `STACK.md:120, 227` | ✓ TRAZADA |
| SDK de Lemon Squeezy congelado desde 2024-11-05 | `STACK.md:119` | ✓ TRAZADA |
| Umbral de €10.000 solo para vendedores establecidos en la UE; non-Union OSS sin mínimo; IVA español 21% desde la primera venta | `PITFALLS.md:474, 476, 824` y la fuente de la Comisión Europea en `PITFALLS.md:845` | ✓ TRAZADA con atribución inline |
| Cita de Google sobre mover contenido a subdominio | `PITFALLS.md:102, 821` | ✓ TRAZADA |
| Art. 5(3) de ePrivacy | `PITFALLS.md:441, 851` | ✓ TRAZADA |
| Los 11 programas sin programa usable | `FEATURES.md:82, 84, 85, 86, 87, 88, 89, 90, 91, 92`, todos ABSENCE-VERIFIED | ✓ TRAZADA una por una |
| Vercel sin datos públicos y SE Ranking sin cláusula de renovación | `FEATURES.md:74, 68, 97` | ✓ TRAZADA y presentada como no verificada |

Hallazgo a favor del documento: el research escribe el borde inferior del modelo como `V × 0.0005` (`PITFALLS.md:261`), que no es el producto de sus propias bandas. DECISIONS.md usa `0,0004`, que sí es 2% × 2%. Es decir, el documento corrigió la aritmética del research en vez de copiarla, que es exactamente lo que pide el objetivo de la fase ("multiplicaciones explícitas y no intuición").

### Comprobaciones de comportamiento

Step 7b: OMITIDO. Es una fase de documentación pura, sin puntos de entrada ejecutables, sin API, sin CLI y sin build asociado. No hay comportamiento en tiempo de ejecución que ejercitar.

### Ejecución de probes

Step 7c: OMITIDO. Ni el PLAN ni el SUMMARY ni los criterios de éxito declaran probes, y no existen `scripts/*/tests/probe-*.sh` relevantes para esta fase.

### Cobertura de requirements

| Requirement | Plan de origen | Descripción | Status | Evidencia |
| --- | --- | --- | --- | --- |
| DEC-01 | 44-01 | Estado real de la cuenta de Amazon con su deadline y el disclosure como prerequisito | ✓ SATISFECHO | Sección DEC-01 completa, más la propagación a los tres archivos. En REQUIREMENTS.md ya figura marcado `[x]` y reescrito |
| DEC-02 | 44-01 | Modelo de ingresos con multiplicación explícita, no estimación vaga | ✓ SATISFECHO | Sección DEC-02 con fórmula, tramos y punto de equilibrio; aritmética recalculada de forma independiente |
| DEC-03 | 44-01 | Polar como MoR, con el razonamiento, la cuenta abierta y cero código | ? NECESITA HUMANO | Documentación y "cero código" verificados. La cláusula "con la cuenta abierta" queda pendiente de la acción manual de Juan |
| DEC-04 | 44-01 | Lista priorizada con umbrales y programas sin programa usable | ✓ SATISFECHO | Sección DEC-04, tres tablas, los 8 nombres exigidos presentes |
| DEC-05 | 44-01 | Las 4 mitigaciones equivocadas descartadas por escrito | ✓ SATISFECHO | Sección DEC-05, cuatro subsecciones con razón y fuente |

Requirements huérfanos: ninguno. REQUIREMENTS.md mapea DEC-01 a DEC-05 a la Phase 44 y el plan único los reclama a los cinco.

### Anti-patrones encontrados

| Archivo | Línea | Patrón | Severidad | Impacto |
| --- | --- | --- | --- | --- |
| `DECISIONS.md` | — | Ninguno | — | Cero marcadores `TODO`, `TBD`, `FIXME`, `XXX`, `HACK` o `PLACEHOLDER` en el entregable. Las casillas sin marcar son acciones asignadas a una persona con fecha o disparador, no deuda anónima |
| `.planning/ROADMAP.md` | 1096 | `**Plans**: TBD` bajo Phase 44 | ℹ️ Info | Texto de plantilla preexistente, no introducido por esta fase: el commit `50538b9` agrega una sola línea al ROADMAP (la nota de deadline) y las Phases 45 a 50 tienen la misma línea. Queda desactualizado ahora que existe `44-01-PLAN.md`. No bloquea el objetivo |
| `.planning/ROADMAP.md` | 86, 91 | El listado del milestone todavía llama a la Phase 44 "Baseline de Regresión + Decisiones de Monetización" y la Phase 49 dice comparar "contra el baseline de Phase 44" | ⚠️ Advertencia | Restos de antes de separar decisiones (44) del baseline (45). Preexistente, fuera del alcance declarado de esta fase, pero puede confundir a quien planifique las Phases 45 y 50. Conviene limpiarlo cuando se retome el milestone |
| `.planning/REQUIREMENTS.md` | 19 a 22, 134 a 138 | DEC-01 quedó marcado `[x]` pero su fila de trazabilidad sigue en "Pending", y DEC-02 a DEC-05 siguen sin marcar pese a estar entregados | ⚠️ Advertencia | Inconsistencia de contabilidad, no de contenido. La tabla de trazabilidad de este milestone está entera en "Pending" (es un archivo nuevo), así que actualizarla es trabajo de cierre de fase, no del plan. Corregir al comitear la fase |

### Verificación humana requerida

#### 1. Alta de la cuenta en Polar

**Qué hacer:** entrar a `polar.sh`, crear la cuenta con la identidad fiscal correcta (persona natural, Perú), completar el KYC y conectar la cuenta de pagos. Se apoya en Stripe Connect Express por debajo, que es distinto de tener una cuenta de comerciante de Stripe, que es justamente lo que Perú no soporta. No crear productos todavía. Al terminar, marcar la casilla del final de DECISIONS.md con la fecha.
**Resultado esperado:** cuenta activa, KYC aprobado, payout conectado y la casilla `[ ] cuenta Polar creada — fecha: ____` completada.
**Por qué humano:** exige identidad y documentos de Juan. El plan la declara Out of Scope y ningún agente puede ejecutarla. Es la única parte del criterio 4 del ROADMAP que sigue abierta.

#### 2. Precio real de los planes de DinoRANK

**Qué hacer:** al postular a DinoRANK, anotar el precio real de los planes y recalcular el punto de equilibrio de DEC-02 (hoy calculado sobre un supuesto de €30/mes).
**Resultado esperado:** el valor por suscriptor a 12 meses queda sobre precio real y la advertencia de "supuesto ilustrativo, no verificado" se retira.
**Por qué humano:** requiere leer la página de precios en vivo en el momento de postular. El documento ya lo marca como no verificado, así que no compromete la regla de procedencia, pero queda abierto.

### Resumen

El objetivo de la fase se cumple. Las cinco decisiones están escritas con su razonamiento y su consecuencia operativa, no como intuición: el modelo de ingresos es una multiplicación que se puede auditar factor por factor (y de hecho la audité, y corrige un error aritmético del propio research), el orden de postulación viene con umbrales y bloqueos, el estado de Amazon está con fecha de vencimiento y con el riesgo dimensionado sin adornos, y las cuatro mitigaciones populares quedan descartadas con la cita que las descarta. La regla de procedencia se sostiene: revisé cada comisión, umbral y cita de política contra los archivos de research y no encontré una sola cifra huérfana, mientras que lo no verificado (precio de DinoRANK, impuesto a la renta peruano, datos de Vercel, renovaciones de SE Ranking, payouts de Gumroad en Perú) aparece marcado como tal en lugar de rellenado con un número plausible.

La propagación del hallazgo de Amazon llegó a los tres destinos y se comprobó en los archivos, no en el SUMMARY: la open question del research está tachada y resuelta, el ROADMAP lleva la nota de deadline duro dentro de la sección de la Phase 48, y DEC-01 en REQUIREMENTS dice que la cuenta ya está creada. El criterio 6 se cumple de forma estricta: `git diff --stat HEAD -- src/` y `git status --short src/` no devuelven nada, y el commit de la fase toca únicamente archivos bajo `.planning/`.

Queda un solo ítem abierto y es de Juan, no de ejecución: abrir la cuenta en Polar. El criterio 4 del ROADMAP la pide, pero el plan la excluyó a propósito porque exige KYC con su identidad, y el documento entrega los pasos exactos y la casilla para registrar la fecha. Por eso la fase cierra en `human_needed` con 5 de 6 y no en `gaps_found`: no falta trabajo, falta un trámite con dueño nombrado.

Aparte de eso quedan dos limpiezas menores de bookkeeping que no afectan el objetivo: la tabla de trazabilidad de REQUIREMENTS.md sigue diciendo "Pending" para los cinco DEC (y DEC-01 quedó marcado `[x]` con su fila todavía en Pending), y el listado del milestone en el ROADMAP arrastra el nombre viejo de la Phase 44 de cuando decisiones y baseline iban juntas.

---

_Verificado: 2026-08-30T18:29:40Z_
_Verificador: Claude (gsd-verifier)_
