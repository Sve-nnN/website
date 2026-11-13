import sys,html,csv,json
S="/private/tmp/claude-501/-Users-juan-Documents-Codigo-Personal-juantech-juan-payload/4733a4c1-4fd3-42c8-b200-cd5fc18963d0/scratchpad"
sys.path.insert(0,S)
from css import CSS
from titles import T
e=html.escape
trows="".join(f"<tr><td><code>{e(u)}</code></td><td>{e(c)}</td><td><del>{e(a)}</del></td><td><ins>{e(p)}</ins></td><td>{e(m)}</td></tr>" for u,c,a,p,m in T)
with open(S+"/out/titles-descriptions.csv","w",newline="",encoding="utf-8") as fh:
    w=csv.writer(fh); w.writerow(["url","campo","actual","propuesto","motivo"]); w.writerows(T)
BODY=f'''
<a class="skip" href="#main">Saltar al contenido</a>
<header class="top"><div class="wrap">
<p class="eyebrow">Pilares, enlazado interno y contenido · 13 de noviembre de 2026</p>
<h1>Los pilares actuales tienen autoridad en el papel y cero en Google</h1>
<p class="lead">Rastreé las 169 URLs de juan-tech.com y las crucé con 90 días de Search Console. Los pilares que declaraste reciben muchos enlaces, pero Google no los muestra. Las páginas que sí rankean son cuatro tutoriales que aparecen en el menú de todo el sitio. Este informe te dice qué mantener, qué fusionar, qué crear y cómo repartir la autoridad hacia los servicios.</p>
</div></header>
<nav class="toc" aria-label="Secciones"><ul>
<li><a href="#veredicto">1. Veredicto</a></li><li><a href="#hallazgos">2. Hallazgos</a></li><li><a href="#linkjuice">3. Link juice</a></li><li><a href="#estructura">4. Estructura nueva</a></li><li><a href="#consolidar">5. Fusiones</a></li><li><a href="#contenido">6. Contenido</a></li><li><a href="#extras">7. Hallazgos extra</a></li><li><a href="#plan">8. Plan</a></li><li><a href="#decisiones">9. Decisiones</a></li><li><a href="#archivos">10. Archivos</a></li></ul></nav>
<main id="main" class="wrap">

<section id="veredicto">
<h2>1. Veredicto: qué hacer con cada pilar</h2>
<div class="kpis">
<div class="kpi"><b>5</b><span>pilares evaluados (4 existentes, 1 por crear)</span></div>
<div class="kpi"><b>62</b><span>artículos en español rastreados</span></div>
<div class="kpi"><b>18</b><span>artículos con 2 o menos enlaces de cuerpo entrantes</span></div>
<div class="kpi"><b>216</b><span>enlaces nuevos propuestos</span></div>
</div>
<div class="tbl"><table><caption>Estado de cada pilar (GSC 90 días, URL canónica actual)</caption>
<thead><tr><th>Pilar</th><th class="n">Palabras</th><th class="n">Enlaces de cuerpo entrantes</th><th class="n">Impr. GSC</th><th>Veredicto</th><th>Qué hacer</th></tr></thead><tbody>
<tr><td><code>/blog/seo/estrategia-seo</code></td><td class="n">4.119</td><td class="n">27</td><td class="n">2</td><td><span class="tag keep">Mantener y reconstruir</span></td><td>Tiene demanda (260 ES) y encaja con el servicio de consultoría. Cambia el title, ordena los H2 por intención y conecta los 10 satélites.</td></tr>
<tr><td><code>/blog/tech-seo/technical-seo-guide</code></td><td class="n">3.624</td><td class="n">5</td><td class="n">0</td><td><span class="tag keep">Mantener y alimentar</span></td><td>Es el pilar que más vende (lleva a la auditoría) y el peor enlazado. Pasa de 5 a más de 17 enlaces entrantes.</td></tr>
<tr><td><code>/blog/cs-fundamentals/data-structures</code></td><td class="n">2.314</td><td class="n">21</td><td class="n">1.369</td><td><span class="tag keep">Mantener como motor de tráfico</span></td><td>Gana en Search Console frente a <code>algoritmos-estructuras-datos</code>. Pasa a ser el pilar. Añade el puente hacia SEO técnico y servicios.</td></tr>
<tr><td><code>/blog/cs-fundamentals/algoritmos-estructuras-datos</code></td><td class="n">4.713</td><td class="n">25</td><td class="n">0</td><td><span class="tag cut">Fusionar</span></td><td>Compite con el anterior y llega con el title truncado. Rescata las mejores secciones y redirige a <code>data-structures</code>.</td></tr>
<tr><td><code>/blog/development/*</code> (sin pilar)</td><td class="n">n.d.</td><td class="n">2</td><td class="n">10 (ES)</td><td><span class="tag fix">Redefinir</span></td><td>Mezcla Next.js, CSS y SQL. Se centra en Next.js y CMS headless, con <code>headless-cms-comparison</code> como pilar.</td></tr>
<tr><td>GEO SEO (no existe)</td><td class="n">0</td><td class="n">0</td><td class="n">0</td><td><span class="tag new">Crear</span></td><td>"geo seo" crece 51% en 3 meses, es la keyword de un servicio y el sitio ya tiene la infraestructura. Falta la página que la ancle.</td></tr>
</tbody></table></div>
<div class="callout"><strong>Respuesta corta a tu pregunta.</strong> Sí vale la pena mantener la idea de pilares, pero no como están. Conservo tres, reubico uno, fusiono otro y creo el de GEO. El de estructuras de datos sigue como pilar de tráfico (80% de tus clics), y el de SEO técnico pasa a ser el pilar de negocio.</div>
</section>

<section id="hallazgos">
<h2>2. Hallazgos que explican por qué los pilares no rankean</h2>
<div class="grid2">
<div class="card"><h3 style="margin-top:0">1. Cuatro artículos se llevan toda la autoridad</h3><p><code>react-19</code>, <code>tablas-hash</code>, <code>recursividad</code> y <code>pilas-y-colas</code> reciben 92 enlaces cada uno, porque aparecen en el menú o el pie de todo el sitio. El resto de los artículos recibe 3. Son justo los cuatro que más clics traen. Parece que el bloque "Últimos artículos" los fija ahí, y cuando salga un artículo nuevo la autoridad se mueve sola.</p></div>
<div class="card"><h3 style="margin-top:0">2. Los pilares compiten con sus hermanos</h3><p>"Complejidad" tiene cuatro páginas (<code>complejidad-algoritmica</code>, <code>big-o-notation</code>, <code>time-complexity</code>, <code>space-complexity</code>). "Programación dinámica" tiene dos. "Datos estructurados" tiene dos. Google elige una y las demás quedan debajo.</p></div>
<div class="card"><h3 style="margin-top:0">3. Nueve títulos llegan cortados</h3><p>Nueve páginas muestran "..." en el title y en el H1, entre ellas <code>complejidad-algoritmica</code>, <code>guia-eeat</code>, <code>topic-clusters-seo</code> y <code>astro-vs-nextjs</code>. Un H1 cortado a mitad de palabra le dice al usuario que nadie revisó la página.</p></div>
<div class="card"><h3 style="margin-top:0">4. Los servicios casi no reciben enlaces de cuerpo</h3><p>Cada servicio recibe 2 enlaces de cuerpo entrantes y apenas 3 salientes. Tienen 669 a 823 palabras y repiten el mismo caso. El tráfico de los tutoriales no baja hacia ellos.</p></div>
<div class="card"><h3 style="margin-top:0">5. Hay 7 casos con métricas y los servicios dicen que no</h3><p>Las tres landings afirman "todavía no tengo un caso publicado" mientras el sitio tiene siete casos, entre ellos +309%, +406% y +143% de clics interanuales. Es la prueba más fuerte y no se usa.</p></div>
<div class="card"><h3 style="margin-top:0">6. Enlaces rotos y con saltos</h3><p>Hay enlaces internos a 6 rutas que dan 404 (por ejemplo <code>/blog/general/tech-seo-guide</code>, 4 veces) y a unas 40 rutas que redirigen con 308. Cada salto diluye autoridad y gasta rastreo.</p></div>
</div>
</section>

<section id="linkjuice">
<h2>3. Link juice: cómo se reparte hoy y cómo quedaría</h2>
<p>Modelé el sitio como un grafo y calculé una autoridad interna relativa, al estilo PageRank, con factor de amortiguación 0,85. Los enlaces de cuerpo pesan 1,0 y los de menú o pie pesan 0,25. Un valor de 1,0 equivale a la media de una página.</p>
<div class="tbl"><table><caption>Autoridad interna por grupo, suma por grupo (hoy contra propuesta)</caption>
<thead><tr><th>Grupo</th><th class="n">Páginas</th><th class="n">Hoy</th><th class="n">Propuesta</th><th class="n">Cambio</th></tr></thead><tbody>
<tr><td>Pilar SEO técnico</td><td class="n">1</td><td class="n">0,24</td><td class="n">0,81</td><td class="n">+241%</td></tr>
<tr><td>Pilar Next.js y CMS headless</td><td class="n">1</td><td class="n">0,24</td><td class="n">0,74</td><td class="n">+210%</td></tr>
<tr><td>Pilar GEO (nuevo)</td><td class="n">1</td><td class="n">0,16</td><td class="n">0,85</td><td class="n">+447%</td></tr>
<tr><td>Pilar Estrategia SEO</td><td class="n">1</td><td class="n">0,63</td><td class="n">0,80</td><td class="n">+28%</td></tr>
<tr><td>Pilar Estructuras de datos</td><td class="n">1</td><td class="n">0,97</td><td class="n">1,13</td><td class="n">+16%</td></tr>
<tr><td><strong>Páginas de servicio</strong></td><td class="n">4</td><td class="n">9,65</td><td class="n">12,03</td><td class="n">+25%</td></tr>
<tr><td>Artículos de SEO técnico</td><td class="n">18</td><td class="n">5,99</td><td class="n">8,09</td><td class="n">+35%</td></tr>
<tr><td>Artículos de SEO</td><td class="n">10</td><td class="n">3,98</td><td class="n">4,35</td><td class="n">+9%</td></tr>
<tr><td>Artículos de estructuras de datos</td><td class="n">21</td><td class="n">15,10</td><td class="n">14,99</td><td class="n">-1%</td></tr>
<tr><td>Casos de éxito</td><td class="n">7</td><td class="n">13,55</td><td class="n">12,18</td><td class="n">-10%</td></tr>
<tr><td>Home, hubs y otras páginas</td><td class="n">24</td><td class="n">39,16</td><td class="n">33,71</td><td class="n">-14%</td></tr>
</tbody></table></div>
<div class="callout good"><strong>Qué significa.</strong> La autoridad se mueve de páginas que no la necesitan (home, contacto, páginas legales) hacia pilares y servicios. Los artículos de estructuras de datos se quedan igual, así que no pierdes lo que ya rankea. Las páginas de servicio ganan un 25% sin cambiar el menú.</div>
<div class="callout warn"><strong>Límite del modelo.</strong> Google no publica su cálculo. Esto sirve para comparar el antes y el después con la misma regla, no para predecir posiciones. El efecto real se mide en Search Console a las 6 y 12 semanas.</div>

<h3>Reglas de enlazado que sigue la matriz</h3>
<ol class="s">
<li><strong>Cada artículo enlaza a su pilar</strong> en la primera mención del tema, y el pilar enlaza a cada artículo.</li>
<li><strong>Dos enlaces entre hermanos</strong> del mismo cluster, dentro del cuerpo y con anchor descriptivo.</li>
<li><strong>Un puente entre clusters</strong> por artículo, en el bloque "Lee también".</li>
<li><strong>Cada artículo cierra con un enlace a su servicio</strong>, con una frase que diga qué resuelve.</li>
<li><strong>Cada servicio enlaza a 2 guías y a sus casos</strong>, y cada caso enlaza de vuelta al servicio.</li>
<li><strong>Anchors con la keyword o una variante natural.</strong> Nada de "haz clic aquí" ni de "leer más".</li>
<li><strong>Cualquier página llega desde el pilar en 2 clics</strong> o menos.</li>
</ol>
<h3>Cambios de menú y pie que mueven más autoridad</h3>
<ul class="s">
<li>Cambia "Últimos artículos" del pie por una lista fija de guías clave: los cuatro pilares y los tres servicios principales. Así la autoridad deja de depender de lo último que publiques.</li>
<li>Pon el pilar de SEO técnico en el menú de Blog. Hoy tiene 5 enlaces entrantes.</li>
<li>Quita o neutraliza <code>/search</code> y <code>/sitemap.html</code> del pie (93 y 76 enlaces sitewide a páginas sin valor SEO). Usa <code>rel="nofollow"</code> o muévelos al menú de utilidad.</li>
</ul>
</section>

<section id="estructura">
<h2>4. Estructura nueva por pilar</h2>
<p>Cada mapa interactivo muestra el pilar, los clusters y los enlaces obligatorios (línea sólida) y opcionales (punteada). Ábrelos desde la misma carpeta.</p>
<div class="grid2">
<div class="card"><h3 style="margin-top:0">Estrategia SEO · <a href="cluster-map-seo.html">ver mapa</a></h3><p><strong>Pilar:</strong> estrategia-seo.<br><strong>Contenido:</strong> keyword research, estrategia de contenidos, redacción SEO, cursos.<br><strong>Arquitectura:</strong> topic clusters, pillar page, enlaces internos, canibalización.<br><strong>Autoridad:</strong> E-E-A-T, SEO off page.<br><strong>Servicio:</strong> consultoría SEO.</p></div>
<div class="card"><h3 style="margin-top:0">SEO técnico · <a href="cluster-map-tech.html">ver mapa</a></h3><p><strong>Pilar:</strong> technical-seo-guide.<br><strong>Rastreo e indexación:</strong> robots.txt, sitemap, Search Console, auditoría, checklist.<br><strong>Rendimiento y renderizado:</strong> Core Web Vitals, rendimiento, JavaScript SEO, SSR frente a CSR.<br><strong>Datos y on page:</strong> datos estructurados, schema, on page, guía sin programar.<br><strong>Servicio:</strong> auditoría técnica.</p></div>
<div class="card"><h3 style="margin-top:0">GEO SEO (nuevo) · <a href="cluster-map-geo.html">ver mapa</a></h3><p><strong>Pilar:</strong> geo-seo-guia (por escribir).<br><strong>Satélites por escribir:</strong> llms.txt, contenido citable, medición de citas en IA.<br><strong>Entradas existentes:</strong> datos estructurados, E-E-A-T, pilar de SEO técnico.<br><strong>Servicio:</strong> SEO para IA.</p></div>
<div class="card"><h3 style="margin-top:0">Estructuras de datos · <a href="cluster-map-cs.html">ver mapa</a></h3><p><strong>Pilar:</strong> data-structures.<br><strong>Lineales y hash:</strong> pilas y colas, queue, tablas hash, heap.<br><strong>Árboles y grafos:</strong> árboles binarios, BST, recorridos, grafos.<br><strong>Complejidad:</strong> complejidad algorítmica, temporal, espacial.<br><strong>Algoritmos:</strong> ordenamiento, merge sort, quicksort, recursividad, programación dinámica.<br><strong>Bases de datos:</strong> diseño, normalización.<br><strong>Puente:</strong> pilar de SEO técnico y desarrollo full-stack.</p></div>
<div class="card"><h3 style="margin-top:0">Next.js y CMS headless · <a href="cluster-map-dev.html">ver mapa</a></h3><p><strong>Pilar:</strong> headless-cms-comparison.<br><strong>Frameworks:</strong> Astro frente a Next.js, React 19, hidratación.<br><strong>CMS headless:</strong> Next.js con CMS, Payload CMS.<br><strong>SEO del stack:</strong> SEO en Next.js, SEO con CMS headless.<br><strong>Servicio:</strong> desarrollo full-stack.</p></div>
</div>
<h3>Puentes entre pilares</h3>
<p>SEO ↔ SEO técnico, SEO técnico ↔ GEO, Next.js → SEO técnico y Estructuras de datos → SEO técnico. El último es el que convierte a quien llegó por un tutorial de programación en lector de tus servicios.</p>
<h3>Tres artículos que quedan fuera del cluster de desarrollo</h3>
<p><code>sql-vs-nosql</code> pasa a enlazarse desde Bases de datos. <code>que-es-css</code> (1.210 palabras, posición 42) y <code>experiencia-de-usuario</code> (posición 45) no tienen cluster claro: evalúa si valen su espacio o si conviene consolidarlos.</p>
</section>

<section id="consolidar">
<h2>5. Fusiones y diferenciaciones propuestas</h2>
<p class="small">Sigo la regla que aplicaste en agosto: gana la URL que tiene impresiones en Search Console, aunque tenga menos enlaces. Cada fusión implica un 301 y despublicar la perdedora, así que necesitan tu aprobación por nombre.</p>
<div class="tbl"><table><caption>Acciones sobre contenido que compite</caption>
<thead><tr><th>Caso</th><th>Gana</th><th>Pierde</th><th>Dato que lo respalda</th></tr></thead><tbody>
<tr><td>Programación dinámica</td><td><code>dynamic-programming</code></td><td><code>programacion-dinamica</code></td><td>747 impresiones contra 0. La perdedora tiene 3.069 palabras: rescatar secciones.</td></tr>
<tr><td>Estructuras de datos</td><td><code>data-structures</code></td><td><code>algoritmos-estructuras-datos</code></td><td>1.369 impresiones y 15 clics contra 0.</td></tr>
<tr><td>Complejidad</td><td><code>complejidad-algoritmica</code> como hub, con <code>time</code> y <code>space</code> como hijos</td><td><code>big-o-notation</code></td><td>Ninguna tiene impresiones. Big O cabe dentro de la guía de complejidad (5.726 palabras).</td></tr>
<tr><td>Datos estructurados</td><td>Decidir con la SERP</td><td><code>structured-data-seo</code> o <code>schema-markup-guide</code></td><td>52 impresiones (posición 58) contra 1 (posición 6). Hace falta ver la SERP para elegir.</td></tr>
<tr><td>Auditoría SEO</td><td>Servicio: "auditoría seo técnica"</td><td>Artículo: "cómo hacer una auditoría seo"</td><td>No se fusionan. Se separan por intención para que no compitan.</td></tr>
<tr><td>Pilas y colas</td><td colspan="2">Se quedan los dos</td><td><code>pilas-y-colas</code> es la vista general y <code>queue-data-structure</code> la profundidad.</td></tr>
</tbody></table></div>
</section>

<section id="contenido">
<h2>6. Optimización de contenido existente</h2>
<p>Esta tabla cubre las 25 páginas con más impresiones o con errores visibles. La lista completa está en <code>titles-descriptions.csv</code>. Todos los titles respetan tu regla: sin puntos ni comas y con la keyword al inicio (la excepción es "Next.js", que lleva punto por ser el nombre).</p>
<div class="tbl"><table><caption>Titles y descriptions: antes y después</caption>
<thead><tr><th>URL</th><th>Campo</th><th>Actual</th><th>Propuesto</th><th>Motivo</th></tr></thead><tbody>{trows}</tbody></table></div>
<h3>Reescritura de páginas</h3>
<p>Las reescrituras de las tres landings de servicio, de los dos hubs y el brief del pilar de GEO están en <a href="reescrituras-paginas.html">reescrituras-paginas.html</a>, listas para copiar.</p>
<h3>Mejoras de cuerpo para los tutoriales que ya rankean</h3>
<ul class="s">
<li><strong>Respuesta directa arriba:</strong> un párrafo de 40 a 60 palabras que defina el concepto antes del primer H2. Mejora el fragmento destacado y la citabilidad por IA.</li>
<li><strong>H2 como preguntas reales:</strong> usa las consultas de GSC ("pilas y colas en python", "ventajas y desventajas de la recursividad").</li>
<li><strong>Un bloque de código ejecutable</strong> por artículo y una tabla comparativa donde aplique.</li>
<li><strong>Bloque "De tutorial a producción"</strong> al final: una sección que explique dónde importa ese concepto en un sitio real (rendimiento, rastreo, estructura) y enlace al servicio.</li>
<li><strong>Autor visible con credenciales</strong> y fecha de actualización, para reforzar E-E-A-T.</li>
</ul>
</section>

<section id="extras">
<h2>7. Hallazgos extra que descubrí con las demás funciones de claude-seo</h2>
<div class="tbl"><table><caption>Por prioridad</caption>
<thead><tr><th>Prioridad</th><th>Hallazgo</th><th>Acción</th></tr></thead><tbody>
<tr><td><span class="tag cut">Alta</span></td><td><strong>17 URLs en inglés con status 200 fuera del sitemap y sin hreflang "en".</strong> Siete tienen el título en español (tablas-hash, estrategia-seo, technical-seo-guide, seo-off-page-guia, estrategia-de-contenidos, mejores-cursos, que-es-css). Las enlazas desde el menú inglés (80 enlaces a tablas-hash).</td><td>Traduce las siete o redirígelas a la versión española con hreflang. Añade las 17 al sitemap o ponles noindex.</td></tr>
<tr><td><span class="tag cut">Alta</span></td><td><strong>6 enlaces internos a 404</strong> (<code>/blog/general/tech-seo-guide</code> ×4, <code>/blog/development/payloadcms-vs-strapi</code> ×4, <code>nextjs-portfolio</code> ×2, <code>nextjs-server-components</code>) y <code>/en/sitemap.html</code> con 404 enlazado 76 veces.</td><td>Corrige o elimina los enlaces. El pie inglés rompe 76 páginas.</td></tr>
<tr><td><span class="tag fix">Media</span></td><td><strong>Unos 40 enlaces internos con 308</strong> (<code>/blog/general/...</code>, <code>/blog/cs-fundamentals/sql-vs-nosql</code>, <code>seo-copywriting</code>).</td><td>Actualiza el destino en el contenido. El script 16 ya lo hace para otros casos.</td></tr>
<tr><td><span class="tag fix">Media</span></td><td><strong>654 de 952 imágenes sin atributo alt</strong> en el cuerpo de las páginas (69%).</td><td>Genera alt descriptivo por plantilla y revisa a mano las de casos y servicios.</td></tr>
<tr><td><span class="tag fix">Media</span></td><td><strong>54 descriptions con más de 160 caracteres y 18 con menos de 110.</strong> Seis páginas no tienen description (<code>/stack</code>, <code>/case-studies</code>, <code>/authors</code> en ES y EN).</td><td>Une esto con las 62 descriptions pendientes desde agosto.</td></tr>
<tr><td><span class="tag fix">Media</span></td><td><strong>Voseo en 9 páginas</strong> ("tenés", "podés", "acá"). Pediste español neutro.</td><td>Reemplaza por "tienes", "puedes", "aquí". Páginas: audit, stack, y 7 artículos.</td></tr>
<tr><td><span class="tag fix">Media</span></td><td><strong>Schema incompleto:</strong> los hubs solo emiten BreadcrumbList. Los pilares no emiten ItemList. Los servicios no emiten FAQPage aunque tienen FAQ.</td><td>Añade CollectionPage con ItemList en hubs y pilares, y FAQPage en servicios (aporta más a la citabilidad en IA que al snippet de Google).</td></tr>
<tr><td><span class="tag fix">Media</span></td><td><strong>llms.txt corto (1.490 bytes)</strong> y <code>/en/llms.txt</code> con 404.</td><td>Incluye pilares, casos y servicios. Publica la versión en inglés.</td></tr>
<tr><td><span class="tag keep">Baja</span></td><td>Los 2 H1 y titles de EN con "..." (<code>quicksort-python</code>).</td><td>Se corrige junto con los 9 titles truncados.</td></tr>
<tr><td><span class="tag keep">Baja</span></td><td>Títulos duplicados entre ES y EN en páginas de websites ("Aprendoclub | Juan Carlos Angulo" ×2).</td><td>Traduce el title EN.</td></tr>
<tr><td><span class="tag keep">Baja</span></td><td>Funciones de claude-seo sin usar aún.</td><td><code>seo-drift</code> para guardar una línea base antes de aplicar cambios y detectar regresiones. <code>seo-schema</code> para validar el JSON-LD. <code>seo-sxo</code> para revisar si la forma de página coincide con la SERP de "consultor seo".</td></tr>
</tbody></table></div>
<p class="small">Lo bueno: todos los artículos ya emiten Article con Person y dateModified, el robots.txt está abierto a todos los rastreadores y <code>/llms.txt</code> funciona.</p>
</section>

<section id="plan">
<h2>8. Plan de ejecución ordenado</h2>
<div class="flow">
<div class="step"><div class="num">1</div><div><strong>Semana 1. Higiene sin riesgo.</strong> Corrige los 6 enlaces 404 y los 308. Arregla los 9 titles y H1 truncados. Quita el voseo. Cambia el pie por guías fijas. Ninguna de estas acciones borra contenido.</div></div>
<div class="step"><div class="num">2</div><div><strong>Semana 1 a 2. Línea base.</strong> Corre <code>seo-drift</code> sobre las 20 URLs clave y exporta GSC. Sin esta foto no puedes medir el efecto.</div></div>
<div class="step"><div class="num">3</div><div><strong>Semana 2 a 3. Enlazado.</strong> Aplica la matriz de 216 enlaces por categoría, empezando por SEO técnico y servicios. Un script con <code>draft: false</code> explícito y verificación contra el HTML de producción.</div></div>
<div class="step"><div class="num">4</div><div><strong>Semana 3 a 4. Servicios y hubs.</strong> Publica las tres reescrituras y los dos hubs de <a href="reescrituras-paginas.html">reescrituras-paginas.html</a>.</div></div>
<div class="step"><div class="num">5</div><div><strong>Semana 4 a 6. Fusiones.</strong> Con tu aprobación por nombre: los tres 301 y la despublicación de las perdedoras, con backup en <code>research/canibalizacion/</code> como en el script 16.</div></div>
<div class="step"><div class="num">6</div><div><strong>Semana 5 a 8. Pilar de GEO.</strong> Mide volúmenes de los satélites en Keyword Planner, escribe el pilar con datos propios y publícalo.</div></div>
<div class="step"><div class="num">7</div><div><strong>Semana 6 a 10. Inglés.</strong> Resuelve las 17 URLs EN: traducir, redirigir o noindex.</div></div>
<div class="step"><div class="num">8</div><div><strong>Semana 6 y 12. Medición.</strong> Compara Search Console contra la línea base: impresiones y posición de los pilares, clics a servicios, CTR de los 10 tutoriales con nuevo title.</div></div>
</div>
</section>

<section id="decisiones">
<h2>9. Decisiones que necesito de Juan</h2>
<div class="grid2">
<div class="card"><strong>1. Fusiones.</strong> ¿Apruebas por nombre las tres: <code>programacion-dinamica</code>, <code>algoritmos-estructuras-datos</code> y <code>big-o-notation</code>?</div>
<div class="card"><strong>2. Datos estructurados.</strong> ¿Espero a ver la SERP para elegir entre <code>structured-data-seo</code> y <code>schema-markup-guide</code>?</div>
<div class="card"><strong>3. Pie del sitio.</strong> ¿Reemplazo "Últimos artículos" por una lista fija de guías clave?</div>
<div class="card"><strong>4. Páginas EN sin traducir.</strong> ¿Traduzco las siete o las redirijo a la versión española?</div>
<div class="card"><strong>5. Desarrollo.</strong> ¿Dejo <code>que-es-css</code> y <code>experiencia-de-usuario</code> como están o los consolido?</div>
<div class="card"><strong>6. Aplicación.</strong> ¿Quieres que aplique todo esto por GSD en fases, con verificación en producción tras cada una?</div>
</div>
<div class="callout warn"><strong>Límites de este análisis.</strong> No pude validar la intención de las SERP porque SerpAPI estaba en límite. Los volúmenes vienen de Keyword Planner (España y México) y de Ahrefs de agosto. El modelo de link juice es una aproximación. Los titles propuestos asumen el contenido de cada página: léelos contra el texto real antes de publicar. No apliqué ningún cambio en producción ni en la base.</div>
</section>

<section id="archivos">
<h2>10. Archivos generados</h2>
<ul class="s">
<li><a href="link-matrix.csv">link-matrix.csv</a>: 216 enlaces con origen, destino, anchor, tipo y ubicación.</li>
<li><a href="titles-descriptions.csv">titles-descriptions.csv</a>: titles y descriptions antes y después.</li>
<li><a href="reescrituras-paginas.html">reescrituras-paginas.html</a>: textos de servicios, hubs y brief del pilar de GEO.</li>
<li>Mapas: <a href="cluster-map-seo.html">SEO</a>, <a href="cluster-map-tech.html">SEO técnico</a>, <a href="cluster-map-geo.html">GEO</a>, <a href="cluster-map-cs.html">Estructuras de datos</a>, <a href="cluster-map-dev.html">Next.js y CMS</a>.</li>
<li>Planes en JSON: <code>cluster-plan-*.json</code> (uno por pilar, formato de la skill seo-cluster).</li>
</ul>
</section>
</main>
<footer class="wrap">Generado el 13 de noviembre de 2026 con claude-seo (seo-cluster, seo-plan, seo-geo, seo-schema, seo-technical), rastreo en vivo de juan-tech.com y Search Console.</footer>
'''
h='<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Evaluación de pilares y enlazado</title><style>'+CSS+'</style></head><body>'+BODY+'</body></html>'
open(S+"/out/evaluacion-pilares-y-enlazado.html","w").write(h)
import re
print(len(h),len(re.findall("—|–",h)))
