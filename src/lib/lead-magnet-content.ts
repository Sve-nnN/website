/**
 * Contenido del checklist de auditoría SEO técnica (el lead magnet de
 * Phase 49). Módulo de datos puro, sin JSX — lo consume tanto el script de
 * generación del PDF (`scripts/generate-lead-magnet-pdf.ts`) como, si algún
 * día hace falta, cualquier otra superficie del sitio.
 *
 * Contenido propio de Juan sobre SEO técnico en general: las 5 categorías
 * están inspiradas en el tipo de problemas que aparecen en cualquier
 * auditoría técnica real (incluida la de este mismo sitio, research/ de este
 * repo), pero cada ítem describe una práctica general, nunca un número o un
 * hallazgo específico de `auditor.juan-tech.com` — ese límite es explícito en
 * 49-CONTEXT.md y en la sección "PDF Layout" de 49-UI-SPEC.md.
 */

export type ChecklistItem = {
  /** Qué revisar — una frase corta y accionable. */
  check: string
  /** Por qué importa — una cláusula breve, no un párrafo. */
  why: string
}

export type ChecklistCategory = {
  title: string
  items: ChecklistItem[]
}

export type LeadMagnetContent = {
  title: string
  byline: string
  footer: string
  categories: ChecklistCategory[]
}

export const LEAD_MAGNET_CONTENT: Record<'es' | 'en', LeadMagnetContent> = {
  es: {
    title: 'Checklist de auditoría SEO técnica',
    byline: 'Por Juan Carlos Angulo · juan-tech.com',
    footer: 'Juan Carlos Angulo · Ingeniero de software y consultor SEO técnico · juan-tech.com',
    categories: [
      {
        title: 'Rastreo e indexación',
        items: [
          {
            check: 'Revisa que robots.txt no bloquee rutas que sí quieres indexar.',
            why: 'Un bloqueo accidental saca páginas enteras del rastreo sin que nadie lo note hasta meses después.',
          },
          {
            check: 'Confirma que el sitemap.xml solo liste URLs con código 200 y sin noindex.',
            why: 'Un sitemap con enlaces muertos o bloqueados le dice a Google que confíe menos en el archivo completo.',
          },
          {
            check: 'Busca redirects encadenados (A → B → C) y aplánalos a un solo salto.',
            why: 'Cada salto extra le cuesta presupuesto de rastreo al buscador y retrasa cuánto tarda en ver contenido nuevo.',
          },
          {
            check:
              'Verifica que cada página tenga una URL canónica clara, con y sin barra final resolviendo al mismo destino.',
            why: 'Dos versiones de la misma página compitiendo por posicionar es un problema que tú mismo te creas.',
          },
          {
            check: 'Revisa Search Console en busca de páginas "rastreadas, actualmente no indexadas" y entiende por qué.',
            why: 'Suele ser contenido delgado o duplicado, no un problema técnico.',
          },
        ],
      },
      {
        title: 'Rendimiento y Core Web Vitals',
        items: [
          {
            check: 'Mide el LCP (Largest Contentful Paint) en el móvil real, no solo en el laboratorio.',
            why: 'Los datos de campo (CrUX) son los que Google usa para el ranking, y suelen ser peores que un test de escritorio.',
          },
          {
            check:
              'Revisa qué recurso carga antes que el elemento LCP y si se puede priorizar con preload o fetchpriority.',
            why: 'Un LCP lento casi siempre viene de una imagen o fuente que tarda en llegar.',
          },
          {
            check: 'Audita el TBT (Total Blocking Time) buscando JavaScript que corre antes de que la página sea interactiva.',
            why: 'Ese bloqueo es la razón por la que un clic temprano se siente "colgado".',
          },
          {
            check:
              'Comprueba que las imágenes tengan ancho y alto explícitos (o aspect-ratio) para evitar saltos de layout.',
            why: 'Un salto de layout (CLS) es la razón más común por la que alguien toca el botón equivocado.',
          },
          {
            check: 'Revisa el TTFB del servidor bajo carga real, no en una sola petición aislada.',
            why: 'Un TTFB alto castiga todas las demás métricas encima.',
          },
        ],
      },
      {
        title: 'Datos estructurados',
        items: [
          {
            check: 'Valida cada tipo de schema (Article, Organization, BreadcrumbList, etc.) antes de publicar.',
            why: 'Un error de sintaxis invalida el bloque entero, no solo el campo con el error.',
          },
          {
            check: 'Revisa que el schema declarado coincida con el contenido visible en la página.',
            why: 'Un desajuste entre lo que dices en el JSON-LD y lo que el usuario ve es justo lo que las guías de calidad de Google marcan.',
          },
          {
            check:
              'Confirma que cada Article incluya datePublished, dateModified y un author con su propio schema.',
            why: 'Sin esos campos, pierdes la posibilidad de aparecer con fecha o autor en el resultado de búsqueda.',
          },
          {
            check:
              'Prioriza el schema en las páginas de mayor valor (posts largos, páginas de servicio, casos de éxito) antes que en todo el sitio de una vez.',
            why: 'El impacto no es uniforme, y cubrir el 100% del sitio antes de validar el primer 10% es perder tiempo si algo sale mal.',
          },
        ],
      },
      {
        title: 'Mobile y accesibilidad',
        items: [
          {
            check: 'Prueba el sitio en un teléfono real, no solo en el emulador del navegador.',
            why: 'El emulador no reproduce fielmente la velocidad de red ni el comportamiento táctil.',
          },
          {
            check: 'Verifica que los objetivos táctiles (botones, enlaces) midan al menos 44×44px, con espacio entre ellos.',
            why: 'Un botón demasiado pequeño o pegado a otro genera toques accidentales, y eso también es una señal de mala experiencia.',
          },
          {
            check: 'Revisa el contraste de color de todo el texto contra su fondo, no solo el texto principal.',
            why: 'Los elementos secundarios (etiquetas, texto de ayuda) son los que más se olvidan.',
          },
          {
            check: 'Confirma que cada campo de formulario tenga una etiqueta accesible real, nunca solo un placeholder.',
            why: 'Un placeholder desaparece al escribir, y muchos lectores de pantalla no lo leen como nombre del campo.',
          },
          {
            check: 'Navega el sitio completo solo con teclado, sin mouse.',
            why: 'Si te quedas atascado en algún punto, un lector de pantalla también se queda atascado ahí.',
          },
        ],
      },
      {
        title: 'Seguridad y canonicalización',
        items: [
          {
            check: 'Confirma que todo el sitio fuerce HTTPS y que ninguna versión http:// quede accesible sin redirigir.',
            why: 'Un navegador que marca tu sitio como "no seguro" pierde la confianza del visitante antes de que lea una sola palabra.',
          },
          {
            check: 'Revisa que el dominio con y sin "www" resuelva a una sola versión canónica, sin doble salto de redirect.',
            why: 'Dos dominios activos sirviendo el mismo contenido dividen la autoridad de enlaces entre ambos.',
          },
          {
            check: 'Verifica los headers de seguridad básicos (HSTS, X-Content-Type-Options, Referrer-Policy).',
            why: 'Cuestan minutos de configurar y cierran clases enteras de ataques triviales.',
          },
          {
            check: 'Revisa que ninguna URL con parámetros de tracking o de sesión termine indexada como página aparte.',
            why: 'Cada variante indexada es contenido duplicado compitiendo contra tu propia versión canónica.',
          },
        ],
      },
    ],
  },
  en: {
    title: 'Technical SEO Audit Checklist',
    byline: 'By Juan Carlos Angulo · juan-tech.com',
    footer: 'Juan Carlos Angulo · Software engineer & technical SEO consultant · juan-tech.com',
    categories: [
      {
        title: 'Crawling & indexing',
        items: [
          {
            check: "Check that robots.txt isn't blocking pages you actually want indexed.",
            why: 'An accidental block can pull whole sections out of crawling for months before anyone notices.',
          },
          {
            check: "Make sure sitemap.xml only lists URLs that return 200 and aren't marked noindex.",
            why: 'A sitemap full of dead links or blocked pages makes Google trust the whole file less.',
          },
          {
            check: 'Look for chained redirects (A → B → C) and flatten them to a single hop.',
            why: 'Every extra hop eats crawl budget and delays how fast new content gets seen.',
          },
          {
            check:
              'Confirm every page has one clear canonical URL, with the trailing-slash and non-trailing-slash versions resolving to the same place.',
            why: 'Two versions of the same page competing for rankings is a problem you created yourself.',
          },
          {
            check: 'Check Search Console for pages "crawled, currently not indexed" and figure out why.',
            why: "It's usually thin or duplicate content, not a technical bug.",
          },
        ],
      },
      {
        title: 'Performance & Core Web Vitals',
        items: [
          {
            check: 'Measure LCP on real mobile devices, not just in a lab test.',
            why: "Field data (CrUX) is what Google actually uses for ranking, and it's usually worse than a desktop test suggests.",
          },
          {
            check:
              'Check what resource loads right before the LCP element and whether it can be prioritized with preload or fetchpriority.',
            why: 'A slow LCP almost always traces back to an image or font that takes too long to arrive.',
          },
          {
            check: 'Audit TBT (Total Blocking Time) for JavaScript that runs before the page becomes interactive.',
            why: "That blocking is why an early click feels stuck.",
          },
          {
            check: 'Verify images have explicit width and height (or aspect-ratio) to prevent layout shifts.',
            why: 'A layout shift (CLS) is the most common reason someone taps the wrong button.',
          },
          {
            check: 'Check server TTFB under real load, not from a single isolated request.',
            why: 'A slow TTFB drags down every other metric on top of it.',
          },
        ],
      },
      {
        title: 'Structured data',
        items: [
          {
            check: 'Validate every schema type (Article, Organization, BreadcrumbList, etc.) before publishing.',
            why: "A syntax error invalidates the whole block, not just the field that's wrong.",
          },
          {
            check: "Make sure the schema you declare actually matches what's visible on the page.",
            why: "A mismatch between your JSON-LD and what the user sees is exactly what Google's quality guidelines flag.",
          },
          {
            check:
              'Confirm every Article includes datePublished, dateModified, and an author with its own schema.',
            why: 'Without those fields, you lose the chance to show a date or byline in the search result.',
          },
          {
            check:
              'Prioritize schema on your highest-value pages (long-form posts, service pages, case studies) before rolling it out everywhere at once.',
            why: "The impact isn't uniform, and covering 100% of the site before validating the first 10% wastes time if something breaks.",
          },
        ],
      },
      {
        title: 'Mobile & accessibility',
        items: [
          {
            check: 'Test the site on an actual phone, not just a browser emulator.',
            why: "Emulators don't faithfully reproduce real network speed or touch behavior.",
          },
          {
            check: 'Check that tap targets (buttons, links) are at least 44×44px, with enough space between them.',
            why: "A target that's too small or too close to another causes accidental taps, which is also a bad-experience signal.",
          },
          {
            check: 'Review color contrast for all text against its background, not just the main body copy.',
            why: 'Secondary elements (labels, helper text) are the ones people forget to check.',
          },
          {
            check: 'Confirm every form field has a real accessible label, never just a placeholder.',
            why: "A placeholder disappears the moment someone starts typing, and many screen readers don't read it as the field's name.",
          },
          {
            check: 'Navigate the whole site using only a keyboard, no mouse.',
            why: 'Wherever you get stuck, a screen reader user gets stuck too.',
          },
        ],
      },
      {
        title: 'Security & canonicalization',
        items: [
          {
            check: 'Confirm the entire site forces HTTPS and no http:// version stays reachable without redirecting.',
            why: 'A browser flagging your site as "not secure" loses a visitor\'s trust before they read a single word.',
          },
          {
            check:
              'Check that the www and non-www versions of your domain resolve to one canonical version, without a double redirect hop.',
            why: 'Two live domains serving the same content split link authority between them.',
          },
          {
            check: 'Verify basic security headers (HSTS, X-Content-Type-Options, Referrer-Policy) are in place.',
            why: 'They take minutes to configure and close off entire classes of trivial attacks.',
          },
          {
            check: 'Check that no URL with tracking or session parameters ends up indexed as if it were a separate page.',
            why: 'Every indexed variant is duplicate content competing against your own canonical version.',
          },
        ],
      },
    ],
  },
}
