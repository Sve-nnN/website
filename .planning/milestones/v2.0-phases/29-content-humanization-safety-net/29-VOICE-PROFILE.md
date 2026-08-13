# Perfil de Voz — Humanización de Contenido

**Propósito:** brief de entrada para el skill `humanizer` en las Phases 30/31 (rewrite de contenido real). No inventa posicionamiento nuevo — toma la voz ya validada en `research/voice-sample-juan.md` (fuente primaria y autoritativa, muestra real de la escritura de Juan), `research/JUAN-PROFILE.md` y el veredicto de competidores de `.planning/research/SUMMARY-v1.6.md`, y los convierte en reglas aplicables en ambos locales (ES y EN).

**Última actualización:** 2026-07-14

---

## Fuente primaria: muestra de voz real (`research/voice-sample-juan.md`)

Antes de cualquier otra regla de este documento, todo pase del skill `humanizer` sobre contenido de este proyecto debe calibrarse primero contra `research/voice-sample-juan.md` — es la base fija de tono, ritmo y vocabulario, por encima de los patrones genéricos del skill. Esto aplica en **ambos locales, ES y EN**, no solo en español.

Rasgos detectados en la muestra, a preservar en toda reescritura:

- **Ritmo mezclado.** Frases largas con varias cláusulas encadenadas por comas, sin buscar pausa dramática, intercaladas con alguna frase corta y declarativa ("mi mentalidad siempre es la misma"). No uniformar todo a oraciones cortas ni todo a oraciones largas — el patrón es la alternancia.
- **Apertura concreta.** Entra directo al contexto real (nombres propios, hechos concretos), no con generalidades ni frases de calentamiento.
- **Conector propio: "así sea X, Y o Z".** Usar tal cual para enumerar variantes de una misma actividad — no sustituir por "ya sea" ni por fórmulas más genéricas.
- **Vocabulario técnico cotidiano, sin anglicismos forzados.** Términos como "código", "servidores", "auditorías técnicas", "terminal" se usan con naturalidad, sin traducir a jerga de marketing ni a anglicismos innecesarios.
- **Tono neutral-directo, primera persona, sin exclamaciones ni artificios.** Cero em dash. Puntuación simple: comas, punto y coma casi ausente.
- **Estructura de ideas: concreto antes de general.** Describe primero el día a día o el hecho específico, y solo después generaliza el principio detrás.
- **Cierre con reflexión personal breve, no moraleja.** Conecta lo técnico con algo personal sin sonar forzado y sin la fórmula "no solo... sino también".
- **Cero muletillas de IA.** Nada de "cabe destacar", "es importante mencionar", ni cierres genéricos tipo "el futuro se ve prometedor".

### Traducción del mismo ritmo/tono al inglés

La muestra está en español, pero la base de voz es la misma en ambos locales — el humanizer no debe producir un inglés más "corporativo" o más pulido que el español solo porque no hay una muestra nativa en ese idioma. Reglas de traspaso:

- **Mismo ritmo mezclado en EN**: frases largas encadenadas con comas + alguna frase corta declarativa, igual que en la muestra ES. No convertir el EN en oraciones cortas y uniformes de estilo "punchy copywriting".
- **Conector propio, versión EN**: "whether it's X, Y, or Z" como equivalente funcional de "así sea X, Y o Z" — mantener el mismo rol de enumerar variantes de una misma actividad, no reemplazar por fórmulas de marketing tipo "from X to Y".
- **Vocabulario técnico sin inflar**: en inglés, igual que en español, usar el término técnico directo (code, servers, technical audits, terminal) sin sinónimos "elegantes" que sí aparecen en escritura de IA (leverage, streamline, robust).
- **Cero em dash y cero muletillas de IA en inglés también** — las mismas reglas de la skill `humanizer` (ver más abajo) aplican con el mismo peso en ambos idiomas; la muestra en español no exime al inglés de la misma disciplina.
- **Cierre con reflexión personal, no CTA de venta**, igual en ambos idiomas — el cierre "conecta lo técnico con lo personal" en ES se traduce a un cierre igual de concreto y sin fórmula motivacional en EN.

---

## Reglas de tono

- **Español neutro, sin voceo.** Nunca "vos"/"tenés" — siempre "tú"/"tienes" o la forma impersonal cuando aplique. Esta regla es no negociable en todo el sitio, ES y EN por igual en cuanto a registro.
- **Primera persona.** "hago", "ayudo", "he trabajado con", "construyo y mantengo". Juan habla de su propio trabajo en primera persona, no en tercera ("Juan ayuda a..." está mal).
- **Credenciales directas y cuantificadas.** No "mucha experiencia" — sí "más de cuatro años de experiencia profesional", "18+ clientes globales", "mejoré el WPO en 35%". El número es el argumento, no el adjetivo.
- **CTA colaborativo, no imperativo unilateral.** "Hablemos", "Trabajemos juntos" — no "Contrátame ya" ni fórmulas de venta agresiva.

## Referencia positiva (voz ya correcta — fuente secundaria)

Esta bio es una referencia secundaria a la muestra de voz de la sección anterior (que es la fuente autoritativa) — sirve para confirmar los mismos rasgos en un texto ya publicado y de mayor extensión. Bio de Authors, fuente real (`research/JUAN-PROFILE.md`, verificada contra `localhost:3000/api/authors`):

> "Soy Juan Carlos Angulo, Ingeniero de Software y Consultor SEO Técnico freelance con sede en Lima, Perú. A lo largo de más de cuatro años de experiencia profesional me he especializado en la intersección entre el desarrollo de software y la optimización para motores de búsqueda. Mi trabajo combina la auditoría técnica SEO —rastreo, indexabilidad, Core Web Vitals, Schema.org y datos estructurados— con el desarrollo full-stack utilizando Next.js y Payload CMS. Ayudo a empresas a mejorar su visibilidad orgánica mediante correcciones a nivel de código, sin intermediarios. Construyo y mantengo juan-tech.com, un blog técnico bilingüe orientado a desarrolladores y profesionales de tecnología en Latinoamérica y España."

Reglas de estilo extraídas de este texto, para reutilizar en cualquier copy nuevo:

1. **Abre con identidad + ubicación, sin rodeos.** "Soy [nombre], [rol] con sede en [ciudad]" — no hay párrafo introductorio genérico antes de decir quién es.
2. **El tiempo se cuantifica, nunca se cualifica de forma vaga.** "más de cuatro años" en vez de "con amplia experiencia" o "años de trayectoria".
3. **El verbo principal es de acción propia, no de rol pasivo.** "me he especializado", "ayudo", "construyo y mantengo" — Juan es el sujeto activo de cada frase, no el objeto de una descripción externa.
4. **Los tecnicismos se nombran, no se explican en exceso.** "rastreo, indexabilidad, Core Web Vitals, Schema.org" se lista como vocabulario asumido, sin un "es decir..." aclaratorio detrás — la precisión técnica es parte del tono, no un lastre a simplificar.

## Contraste con competidores

Basado en el análisis de competidores nombrados en `.planning/research/SUMMARY-v1.6.md`:

- **Arianna Lupi** — habla en primera persona, tono directo y cercano. Ángulo a adoptar: es la referencia de voz para todo el contenido de Juan.
- **Aleyda Solis** — tercera persona, tono más corporativo/institucional. Ángulo a NO adoptar: el sitio de Juan es un portfolio personal, no una marca corporativa, y la voz debe reflejar eso.

Regla derivada: cualquier copy que empiece describiendo a "Juan Carlos Angulo" en tercera persona (salvo casos estructurales como JSON-LD/schema o un kicker de tarjeta donde el nombre es un dato, no prosa) debe reescribirse en primera persona.

## Aplicación por tipo de contenido

Por orden de riesgo ascendente, siguiendo el scope de ROADMAP.md para Phases 30/31:

- **Globals y navegación** (Header, Footer, CTA de navbar): tono breve, directo, sin espacio para desarrollar voz — pero cualquier texto de CTA sigue la regla colaborativa ("Hablemos" > "Contáctame ahora").
- **Páginas core** (Home, About, Services): mayor superficie para aplicar la voz completa — primera persona, credenciales cuantificadas, estructura de la bio de referencia.
- **Páginas de servicios/geo** (ej. `/seo-tecnico-madrid`, `/seo-tecnico-lima`): misma voz, con el cuidado adicional de que los datos locales (stats, testimonios) sean reales o estén marcados `[PLACEHOLDER]` — la humanización de copy no debe camuflar contenido de relleno como si fuera dato real.
- **Blog posts**: voz más flexible por ser contenido técnico extenso, pero mismas reglas anti-IA del skill `humanizer` (sin "cabe destacar", sin listas de tres forzadas, sin cierres genéricos tipo "el futuro es prometedor").
- **Case studies**: mismo tratamiento que blog posts, con atención extra a que las cifras (KPIs, resultados) permanezcan exactas — el skill humaniza prosa, nunca debe alterar números o hechos verificados.

## No hacer

- No usar voceo ("vos", "tenés", "sabés") en ningún punto del sitio, ES o EN.
- No escribir en tercera persona sobre Juan salvo en contextos estructurales no editoriales (schema/JSON-LD, metadatos).
- No usar CTAs agresivos o de venta unilateral ("Contrátame ya", "No esperes más", "Actúa ahora").
- No inventar credenciales, cifras o hechos que no estén verificados en `research/JUAN-PROFILE.md` — si un dato no está confirmado ahí, no se agrega ni se aproxima.
- No usar em dash en ningún idioma — la muestra de voz de Juan no los usa nunca, ni en español ni en inglés.
- No aplicar el ritmo de la muestra solo al español y dejar el inglés en un registro más "pulido" o corporativo — el mismo ritmo mezclado y la misma ausencia de muletillas de IA aplican en EN.
