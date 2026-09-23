# Phase 44: Decisiones de Monetización - Context

**Gathered:** 2026-08-13
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous, `--only 44`)

<domain>
## Phase Boundary

Las decisiones que ordenan todo el milestone v2.1 quedan escritas con sus multiplicaciones explícitas y no como intuición: qué programas de afiliados se postulan y en qué orden, cuánto puede rendir esto realmente, en qué estado está la cuenta de Amazon y qué deadline impone, en qué plataforma se va a cobrar cuando existan productos digitales, y qué mitigaciones populares quedan descartadas a propósito.

**Cero cambio renderizado.** `git diff` sobre `src/` debe quedar vacío en toda la fase. Esta fase no toca código, no toca la base de datos, y no depende de ninguna infraestructura — se separó del baseline (ahora Phase 45) precisamente porque el baseline está bloqueado y esto no.

**Fuera de alcance:** abrir cuentas en nombre de Juan, mandar postulaciones, y cualquier decisión que requiera el número real de tráfico (que llega en Phase 45).
</domain>

<decisions>
## Implementation Decisions

### Resueltas en discuss (propuestas aceptadas en bloque por Juan, 2026-08-13)

| # | Zona gris | Decisión |
|---|-----------|----------|
| 1 | Formato del entregable | **Un solo `DECISIONS.md`** en la carpeta de la fase, con las 5 secciones DEC. Es un documento de referencia que Juan va a releer al postular a cada programa; cinco archivos sueltos se pierden |
| 2 | Cuenta de Polar | Claude documenta la decisión y los pasos exactos de alta. **Juan abre la cuenta** — requiere su identidad y KYC |
| 3 | Postulaciones a programas | Igual: Claude documenta orden, requisitos y qué poner en cada formulario. **Juan las manda** — piden datos y aceptación de términos a su nombre |
| 4 | Tramos del modelo de ingresos | Calcular V=1.000 y V=10.000, más el punto de equilibrio contra una conversión de DinoRANK, para dimensionar Amazon contra los programas recurrentes |

### Dato nuevo que llegó en discuss y cambia el encuadre del milestone

Juan **ya reaplicó a Amazon Associates** y la cuenta fue creada. ID de asociado: **`juantech02-20`**. El correo de alta dice textualmente que si los links no refieren ventas calificadas en **180 días**, la solicitud y el acceso a Associates Central se retiran.

- Reloj arrancado: **2026-08-13**
- Vencimiento: **2027-02-09**
- Punto medio de control: **2026-11-11**

Esto **resuelve la pregunta abierta** que `research/SUMMARY.md` había dejado marcada como condición capaz de invertir el orden de fases ("Open question that could flip it: if DECIDE finds the 180-day clock running, STACK-PAGE becomes deadline-driven"). El reloj corre. La consecuencia se registra en DECISIONS.md y se propaga al roadmap, pero **no reordena las fases**: el orden actual ya le da a la página de stack todo el margen disponible, y adelantarla por encima del baseline o del disclosure rompería gates que existen por razones más caras que este deadline.

El mismo correo repite la obligación de disclosure, lo que confirma de forma independiente LEG-01 y LEG-02.

### Claude's Discretion

Redacción, estructura interna y nivel de detalle de `DECISIONS.md`, siempre que cubra los 5 requirements y que cada afirmación de comisión, umbral o política quede atribuida a la fuente del research con su fecha de verificación. Nada de cifras sin procedencia.
</decisions>

<code_context>
## Existing Code Insights

Ninguna. Esta fase no toca código. El único artefacto es documentación bajo `.planning/phases/44-decisiones-de-monetizaci-n/`.

Insumos de research ya disponibles en el repo:
- `.planning/research/SUMMARY.md` — síntesis y conflictos resueltos
- `.planning/research/FEATURES.md` — tabla de programas verificada en vivo el 2026-08-13, con nivel de fuente por fila
- `.planning/research/STACK.md` — plataformas de pago, Stripe fuera de Perú, Polar como merchant of record
- `.planning/research/PITFALLS.md` — políticas de Amazon y Google citadas textualmente con fecha
</code_context>

<specifics>
## Specific Ideas

- El modelo de ingresos se escribe **paramétrico sobre `V`** (visitas mensuales a la página de stack), con V marcado como incógnita declarada a completar en Phase 45. Nunca un número inventado presentado como medido.
- La tasa de Amazon a usar es **2,50%**, la publicada para "PC & PC Components", que es la categoría dominante de una página de stack de desarrollo.
- El bar real de Amazon en los próximos 180 días **no es facturación, son 3 ventas calificadas**. El documento debe decirlo así, porque cambia por completo qué significa "éxito" en ese plazo.
- Los programas sin programa usable se nombran uno por uno (Cloudflare, Cloudinary, Resend, Payload, Neon, Cursor, Claude, Ahrefs) para que Juan no pierda tiempo buscándolos de nuevo dentro de seis meses.
- Las 4 mitigaciones descartadas van con su razón y su fuente, no como una lista de prohibiciones sin fundamento.
</specifics>

<deferred>
## Deferred Ideas

- Sustituir `V` por el número real de tráfico → **Phase 45** (bloqueada por Neon caído y por juan-tech.com sin proyecto en Ahrefs).
- Postulaciones a Semrush y Hostinger afiliados → retenidas hasta confirmar ~1.000 visitas únicas mensuales en Phase 45.
- Cualquier código de la plataforma de pago → **v2.2**. En v2.1 solo se registra la decisión y se abre la cuenta.
- Evaluación de Amazon FBA → milestone futuro con evaluación propia.
</deferred>
