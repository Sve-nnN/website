# Voz, tono y reglas de escritura: juan-tech.com

Estado: borrador v2 del 2026-10-15. Incluye tus decisiones de dirección (sección 0). Lo que dice "Por confirmar" espera tu respuesta.

Base: `research/voice-sample-juan.md` (muestra real de tu escritura), la skill `humanizer` y las reglas de tu CLAUDE.md global. Aplica a todo texto visible del sitio en ES y EN, a los mockups HTML y a cualquier contenido que vaya a Payload.

---

## 0. Decisiones de Juan (mandan sobre el resto del documento)

1. **Encabezados directos.** Ningún encabezado lleva puntos ni comas. Dicen de qué trata la sección en pocas palabras.
2. **Meta títulos igual.** Sin puntos ni comas, directos, con la palabra clave al inicio.
3. **Habla un profesional con toda su experiencia**, en todas sus áreas: SEO técnico, desarrollo full-stack, infraestructura y servidores, rendimiento web y SEO para IA. No suena a junior, a vendedor ni a agencia.
4. **El sitio muestra expertise y enseña.** Cada página demuestra cómo trabaja Juan y deja algo que el lector aprende. El sitio es la prueba.
5. **Habla de Juan, no de una agencia.** Primera persona del singular. No aparece Sapling ni "nuestro equipo", "nosotros" o "la agencia" en el copy del sitio.
6. Sin em dash, sin en dash y sin tells de IA.

## 1. Quién habla

Juan Carlos Angulo, ingeniero de software y consultor SEO técnico con experiencia en desarrollo, servidores, rendimiento y búsqueda. Habla en primera persona del singular, desde la práctica: audita, arregla código, despliega, mide y explica por qué. No suena a agencia, no suena a gurú y no suena a folleto.

Una frase resume la voz: **un profesional que domina varias áreas, trabaja con las manos en el código y enseña lo que sabe sin adornos.**

### Cómo se nota la experiencia sin presumir

- Explica el porqué de una decisión, no solo el qué. Un profesional señala el criterio.
- Nombra el límite: "esto funciona hasta cierto tamaño de sitio, después cambio de enfoque".
- Conecta áreas: un problema de indexación se resuelve en la plantilla, el servidor o el contenido, y lo dice.
- Usa detalles que solo conoce quien lo hizo: el archivo, el header, la métrica, el orden de los pasos.
- No necesita adjetivos. Los años de experiencia aparecen como hechos verificables, no como "experto con amplia trayectoria".

### Cómo enseña

- Cada página responde una pregunta concreta que el lector tiene.
- Muestra el paso a paso o el criterio de decisión, y deja un ejemplo real o un fragmento de código cuando aporta.
- Explica el término técnico la primera vez, sin condescendencia.
- Cierra con lo que el lector puede hacer ahora, no con una venta.

## 2. Rasgos de la voz

Salen de tu muestra real. Se mantienen en todo el sitio.

| Rasgo | Cómo se ve | Qué evitar |
|---|---|---|
| Entra directo | Empieza por el caso, el cliente anónimo o el problema concreto | Aperturas con generalidades ("En el mundo digital de hoy...") |
| Ritmo mixto | Frases largas con varias cláusulas y comas, cortadas por una frase corta y declarativa | Todas las frases del mismo largo, o puro staccato dramático |
| Concreto antes que general | Describe el día a día o el dato y recién después concluye | Concluir sin evidencia |
| Técnico y cotidiano | Código, servidores, terminal, auditoría, Core Web Vitals | Jerga de marketing, anglicismos forzados |
| Primera persona | "audito", "reviso", "mi enfoque" | Plural mayestático ("nuestro equipo") cuando trabaja una sola persona |
| Conector propio | "asi sea X, Y o Z" para enumerar variantes de una actividad | Cambiarlo por "ya sea" |
| Cierre breve y personal | Una idea que conecta lo técnico con algo real | Moraleja grandilocuente o frase motivacional |

Nota ortográfica: tu muestra está escrita sin tildes ("dias", "asi"). En el sitio publicado, todo lleva ortografía correcta ("días", "así"). El conector pasa a "así sea X, Y o Z".

## 3. Tono según la superficie

El tono cambia con lo que el visitante viene a hacer. La voz no cambia.

| Superficie | Visitante | Tono | Largo típico de frase |
|---|---|---|---|
| Home, hero | Cliente potencial | Directo, seguro, sin promesas | Corto a medio |
| Servicios y landings locales | Cliente evaluando | Claro y explicativo; qué entrego, cómo, en qué orden | Medio |
| Case studies | Cliente o reclutador | Sobrio y factual; el número habla | Medio, con datos |
| Blog | Dev o SEO lector | Didáctico, paso a paso, cercano | Medio a largo |
| Autor / About | Reclutador | Personal y específico; hechos de trayectoria | Medio |
| Contacto | Cliente decidido | Breve y cálido; qué pasa después de enviar | Corto |
| Microcopy de UI (botones, errores, estados) | Cualquiera | Neutro y útil; una acción por botón | Muy corto |
| Texto ASCII, pixel y terminal | Todos | Juguetón y seco, nunca sustituye al texto real | Muy corto |

## 4. Reglas de escritura

### 4.1 Reglas duras (no se negocian)

1. **Sin guiones largos ni medios.** Ni em dash ni en dash. Usa coma, punto o dos puntos.
2. **Sin voz pasiva.** Escribe quién hace qué: "Audito el rastreo", no "El rastreo es auditado".
3. **Español neutro.** Nunca voseo ("vos", "querés", "tenés"). Usa "tú" o la forma impersonal clara.
4. **Cero cifras, clientes o credenciales inventadas.** Todo número tiene fuente real. El dato faltante queda visible como pendiente, no se aproxima.
5. **Cliente anónimo.** Sin nombre, dominio, condado ni conteos que permitan reconstruir quién es.
6. **Sin precios** en landings de servicio. Las tarifas se hablan por contacto.
7. **Paridad ES y EN.** Todo texto existe en los dos idiomas con el mismo significado, no traducido palabra por palabra.
8. **Un H1 por página**, en texto real, nunca dentro de una imagen, canvas o ASCII.
9. **Encabezados sin puntos ni comas.** Aplica a H1, H2, H3 y títulos de cards. Tampoco llevan dos puntos, punto y coma, puntos suspensivos ni signos de exclamación. Directos: "Auditoría técnica SEO", "Cómo corregí el LCP de un ecommerce", no "Auditoría técnica, la base de todo.".
10. **Meta títulos sin puntos ni comas**, directos, con la palabra clave al inicio y un máximo de 60 caracteres. Formato: `Tema principal | Juan Carlos Angulo`.
11. **Habla de Juan, no de una agencia.** Primera persona del singular. Sin "Sapling", "nosotros", "nuestro equipo" ni "la agencia" en el copy del sitio.
12. **Cada página enseña algo** y demuestra cómo trabaja Juan (ver sección 1).

### 4.2 Reglas de estilo

- Una idea por párrafo. El primer párrafo ya dice qué es la página.
- Verbos concretos: audito, corrijo, mido, publico, redirijo. Evita "potenciar", "impulsar", "optimizar" sin objeto.
- Un adjetivo se gana con un dato al lado. "Rápido" solo aparece junto a un número.
- Números con unidad y contexto: "LCP de 3.1 s a 1.8 s en móvil", no "mejoró mucho".
- Enumeraciones de dos o cuatro ítems cuando el contenido lo pide. Evita el automatismo de tres.
- Sin exclamaciones, salvo cita textual.
- Sin preguntas retóricas de apertura.
- Mayúscula solo donde la gramática la pide. Los titulares usan mayúscula inicial y nombres propios, no Title Case.
- Frases de menos de 40 palabras salvo que el ritmo largo lo justifique y se lea en voz alta sin trabarse.

### 4.3 Palabras y patrones que delatan texto de IA (no usar)

- Aperturas y cierres: "en el mundo actual", "en conclusión", "sin duda", "el futuro se ve prometedor", "cabe destacar", "es importante mencionar", "vale la pena señalar".
- Léxico inflado: "robusto", "integral", "holístico", "sinergia", "ecosistema", "panorama", "paradigma", "revolucionario", "de vanguardia", "a medida" sin contenido, "llevar al siguiente nivel", "desbloquear el potencial".
- Estructuras: "no solo X, sino también Y", "más que un X, es un Y", "ya sea... o...", listas de tres adjetivos, gerundios de relleno ("aprovechando, impulsando, garantizando").
- Atribuciones vagas: "los expertos coinciden", "se dice que", "muchas empresas".
- Tono de folleto: superlativos ("el mejor", "líder"), promesas de resultado ("duplica tu tráfico").

### 4.4 Qué sí queremos oír

- "Audito el rastreo, la indexación y los Core Web Vitals, y corrijo el código yo mismo."
- "Primero reviso qué ve Googlebot. Luego decido qué tocar."
- "Esto no lo resuelve un plugin. Se arregla en la plantilla."
- Datos verificables, límites honestos ("este caso es de un sitio pequeño"), y qué entrego en cada etapa.

## 5. Vocabulario

| Preferir | En lugar de |
|---|---|
| auditoría técnica, rastreo, indexación, plantillas | solución integral, 360 grados |
| corrijo en el código | implemento mejores prácticas |
| resultado medido (con fuente) | resultados espectaculares |
| trabajo contigo, hablamos | nuestro equipo de expertos |
| sitio, página, plantilla | activo digital |
| así sea X, Y o Z | ya sea X, Y o Z |

Términos en inglés que se quedan en inglés porque así los usa el oficio: Core Web Vitals, LCP, CLS, INP, crawl budget, schema, canonical, hreflang, sitemap, hosting. Se explican una vez si el público no es técnico.

## 6. Reglas para la capa visual (ASCII, pixel, terminal)

Esta capa sale de la nueva dirección visual del milestone v2.3. El texto de personalidad nunca reemplaza al contenido.

- ASCII y pixel son decoración: `aria-hidden`, nunca llevan información que el lector necesite.
- El microcopy de "terminal" se reserva para etiquetas cortas (`> contacto`, `ok`, `listo`, `error`). Máximo 3 palabras. No aparece en párrafos.
- El humor es seco y escaso. Un guiño por pantalla como máximo.
- Los estados del sistema usan palabras claras ("Enviando", "Enviado", "No se pudo enviar. Reintenta") aunque el estilo visual sea de consola.
- Fuente pixel solo para etiquetas cortas en mayúsculas. Nunca para párrafos ni titulares largos.

## 7. Microcopy de interfaz

| Elemento | Regla | Ejemplo ES | Ejemplo EN |
|---|---|---|---|
| Botón primario | Verbo + objeto, 1 a 3 palabras | Pedir auditoría | Request an audit |
| Botón secundario | Verbo directo | Ver casos | See case studies |
| Enlace | Dice a dónde va | Leer el caso completo | Read the full case |
| Error de formulario | Qué pasó y qué hacer | Falta el correo. Escríbelo para poder responderte. | The email is missing. Add it so I can reply. |
| Éxito | Qué ocurrió y qué sigue | Mensaje enviado. Te respondo en 48 horas hábiles. | Message sent. I reply within 2 business days. |
| Estado vacío | Explica y ofrece salida | Aún no hay artículos en esta categoría. Mira todos. | No posts in this category yet. See all. |

Por confirmar: el plazo de respuesta real (48 horas hábiles es un ejemplo, no un dato).

## 8. Inglés

Mismo carácter, adaptado al idioma, no calcado.

- Español e inglés comparten la voz: directa, concreta, en primera persona.
- En inglés se evita el tono corporativo de EE. UU. ("leverage", "unlock", "seamless", "game-changing", "world-class").
- Contracciones permitidas y naturales ("I don't", "it's") en blog y contacto. En case studies, forma completa.
- Spanglish solo donde el oficio ya lo usa.
- Sin em dash ni en dash tampoco en inglés.

## 9. Antes y después

Genérico:
> Ofrecemos soluciones integrales de SEO técnico para potenciar el posicionamiento de tu negocio y llevarlo al siguiente nivel.

Con tu voz:
> Audito el rastreo, la indexación y la velocidad de tu sitio, y corrijo el código yo mismo. Empiezo por lo que Google ve hoy y sigo por lo que más tráfico te cuesta.

Genérico:
> Los resultados fueron espectaculares y superaron todas las expectativas.

Con tu voz:
> En cuatro meses las impresiones subieron de 8 400 a 21 300 al mes. El clic aumentó porque corregí los títulos y la canibalización entre dos páginas.
> (Ejemplo de forma. Los números reales salen de Search Console, nunca de aquí.)

## 10. Lista de revisión antes de publicar

- [ ] Sin em dash ni en dash.
- [ ] Sin voz pasiva.
- [ ] Sin voseo.
- [ ] Ninguna cifra sin fuente. Cliente anónimo.
- [ ] Sin frases de la lista 4.3.
- [ ] Cada adjetivo tiene un dato al lado.
- [ ] El H1 es texto real y dice lo que ofrece la página.
- [ ] El texto en ES y EN dice lo mismo.
- [ ] Pasa por el humanizer calibrado contra `research/voice-sample-juan.md`.
- [ ] Se lee bien en voz alta.

## 11. Por confirmar con Juan

Resueltas por Juan: "yo" siempre y sin agencia (decisión 5); encabezados y meta títulos sin puntos ni comas (decisiones 1 y 2).

1. ¿Tuteo ("tú") o trato impersonal en todo el sitio? Este borrador asume tuteo cálido y neutro.
2. Los encabezados en forma de pregunta (FAQ) llevan signos de interrogación. ¿Los permites, o los reescribimos como afirmación ("Cuánto dura una auditoría")?
3. Separador del meta título: `|` o ningún separador. El borrador usa `|`.
4. ¿Qué áreas de experiencia van en primer plano? El borrador asume: SEO técnico, desarrollo full-stack con Next.js y Payload, infraestructura y servidores, rendimiento web, SEO para IA.
5. ¿Se menciona el gimnasio y otras facetas personales en la página de autor, como en tu muestra? El borrador lo permite en una línea.
6. ¿Hay palabras que odias o que usas siempre? Súmalas a la sección 5.
7. ¿Plazo de respuesta real para el formulario de contacto?
8. ¿El microcopy de terminal (`> contacto`) te gusta o prefieres texto plano en toda la UI?
