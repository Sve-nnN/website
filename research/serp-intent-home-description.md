# SERP intent check — Home meta.description rewrite (2026-08-01)

> Contexto: opengraph.to seguía marcando `meta.description` de Home como corta (34-36 chars, óptimo 110-160). Antes de reescribirla, se chequeó intención de búsqueda real del keyword objetivo ya bloqueado en Phase 14 (`research/keyword-research/KEYWORD-RESEARCH.md`) para no escribir copy que no calce con lo que Google realmente muestra para ese término.

## Query chequeada

`"seo técnico"` (target keyword ES de Home, vol. 260/mes, Phase 14) vía SerpApi (`google_light`, `location=Peru`, `hl=es`, `gl=pe`).

## Hallazgo: intención 100% informacional

Los 10 resultados orgánicos son todos artículos "¿Qué es el SEO técnico?" de sitios de marketing/agencias grandes (Semrush, Hubspot, Mailchimp, Wix, CEI, thepower.education, koomori, etc.) — ninguno es la home de un consultor/freelancer individual compitiendo por ese head term. Las "related questions" confirman el mismo patrón: definiciones ("¿Qué es el SEO técnico?", "¿Diferencia entre SEO y SEO técnico?"), no resultados de servicio/contratación.

**Implicación práctica:** Home de Juan no va a desplazar a Semrush/Hubspot en ese head term puramente informacional — y no tiene por qué intentarlo. El valor de tener `targetKeyword=seo técnico` en Home es de relevancia temática (asociar la home con el tema), no de competir 1:1 por esa SERP. La `meta.description` debe describir honestamente lo que Home ofrece (consultoría + ingeniería, no un artículo explicativo) en vez de imitar el framing "¿Qué es X?" de los resultados informacionales — sería contenido engañoso (bait) si la description promete una definición y la página entrega un perfil/landing.

## Copy resultante

Grounded en el copy real ya vivo en `https://juan-tech.com` (hero H1 + sección "Estrategia y datos, más allá del código" — auditorías, rendimiento, arquitectura), no inventado:

- **ES** (148 chars): "Soy ingeniero de software y consultor de SEO técnico: auditorías, rendimiento web y arquitectura Next.js/Payload para posicionar tu sitio en Google."
- **EN** (143 chars): "I'm a software engineer and technical SEO consultant: audits, performance, and Next.js/Payload architecture to get your site ranking on Google."

Humanizado contra `research/voice-sample-juan.md`: primera persona, sin em dash, sin muletillas de IA.

Aplicado vía `scripts/seed-phase-og-home-description.ts`.

## Nota para futuras páginas

El mismo chequeo de intención (SerpApi antes de escribir/reescribir `meta.description` o copy on-page dirigido a un `targetKeyword`) vale la pena repetirlo para Author page (`auditoría seo técnico`, Phase 14) y cualquier página nueva con keyword objetivo asignado — no se hizo acá por estar fuera del pedido puntual de Juan (solo Home).
