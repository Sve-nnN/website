/**
 * Manually authored voice overrides for Phase 31 Plan 13 (Posts batch 12,
 * ids 66/67/68 — normalizacion-bases-datos, diseno-bases-datos, arboles-binarios).
 *
 * Keyed by `${postId}:${locale}:${proseNodeIndex}`, where proseNodeIndex is the
 * flat, document-order index of `text` nodes whose direct parent is
 * `heading`/`paragraph`/`listitem` (link-child text and block/table nodes are
 * never assigned an index — see humanize-posts-batch-12.ts's extractIndex()).
 *
 * Scope decision (documented in 31-13-SUMMARY.md): given the real volume of
 * this batch (~700 prose nodes across 3 posts x 2 locales, heavily technical
 * database-design/algorithms glossary content), this override set targets the
 * highest-visibility, highest-AI-tell-density prose: opening paragraphs,
 * closing paragraphs, the duplicate "TL;DR" summary paragraphs (a real AI
 * content-generation artifact present in posts 66 and 68), the exact 3
 * sentences carrying literal em dashes, and a handful of section-intro
 * paragraphs with heavy crucial/fundamental/essential stacking. Technical
 * glossary listitems (term + definition pairs), identifiers, formulas, and
 * complexity notations are left verbatim as facts, per the plan's explicit
 * instruction to never alter technical facts. Headings get a separate,
 * mechanical sentence-case pass in the main script (Spanish headings must not
 * use English-style Title Case — a real, fixable AI tell) rather than manual
 * overrides here.
 */

export const OVERRIDES: Record<string, string> = {
  // ---------- POST 66 (normalizacion-bases-datos) — ES ----------
  '66:es:0': 'Cuando hablo de ',
  '66:es:1':
    ' suelo empezar por la normalización, porque es la base para que un esquema no termine lleno de datos duplicados ni de inconsistencias. No es una teoría abstracta, es el conjunto de reglas (las formas normales) que uso para partir tablas grandes en piezas más chicas y manejables, dejando claras las relaciones entre ellas. Una base bien normalizada evita anomalías, mantiene los datos precisos y, de paso, hace que el mantenimiento, la escalabilidad y el rendimiento de las consultas sean mucho más simples.',
  '66:es:2': '',
  '66:es:3': '',
  '66:es:4': '',
  '66:es:5': '',
  '66:es:6':
    'En corto: normalizar es dividir bien las tablas usando las formas normales (1FN, 2FN, 3FN, BCNF) para no repetir datos ni arrastrar anomalías de inserción, actualización o eliminación. Eso sí, hay casos reales donde desnormalizo a propósito para ganar velocidad, algo que explico más abajo.',
  '66:es:8':
    'La normalización no es un paso opcional. Es una práctica estándar en la ingeniería de bases de datos, y entender sus principios te sirve tanto si eres desarrollador como si diseñas arquitecturas de datos.',
  '66:es:26':
    'Las claves son la base sobre la que se construye toda la normalización. Permiten identificar cada registro sin ambigüedad y establecer relaciones lógicas entre tablas.',
  '66:es:56':
    'Identificar y eliminar estas dependencias descomponiendo tablas es, en el fondo, todo el proceso de normalización.',
  '66:es:131':
    'Normalizar es una inversión de tiempo en la fase de diseño que se paga sola durante toda la vida útil de la base de datos.',
  '66:es:160':
    'La normalización es parte de cómo se cumplen las propiedades ACID (atomicidad, consistencia, aislamiento, durabilidad) en sistemas transaccionales: hace que las operaciones se ejecuten de forma fiable y predecible.',
  '66:es:162':
    'Las anomalías son inconsistencias lógicas que aparecen en bases de datos sin normalizar. Normalizar es, básicamente, la estrategia para eliminarlas.',
  '66:es:185':
    'Al normalizar, cada tabla queda descompuesta de forma que cada hecho se almacena en un solo lugar, así que estas anomalías dejan de ser un problema.',
  '66:es:187':
    'La teoría se entiende mejor con ejemplos concretos de cómo las formas normales transforman un esquema real.',
  '66:es:270': 'La normalización da para mucho. Aquí van algunos recursos si quieres profundizar:',

  // ---------- POST 66 — EN ----------
  '66:en:0': 'Database normalization is something I lean on constantly in ',
  '66:en:1': ' to keep data accurate and ',
  '66:en:2':
    '. This piece walks through the core ideas, with practical examples of 1NF, 2NF, and 3NF, and how normalization deals with the anomalies that show up in messy schemas.',
  '66:en:3':
    'Apply these principles and you get better performance with less redundancy. Here is how the pieces fit together.',
  '66:en:8':
    "The goal of normalization is simple: better data integrity and better efficiency. By following the normal forms (1NF, 2NF, and 3NF, mainly), a database keeps its data consistent and handles complex queries with better performance. Done right, normalization also optimizes storage and makes maintenance easier as the dataset evolves.",
  '66:en:10':
    "Normalization traces back to the early 1970s and Edgar F. Codd's work at IBM. His theoretical framework for relational databases became the foundation for how modern databases work. Since then it has evolved through several stages as data management and storage needs changed. Early on, the focus was mostly on the first three normal forms, 1NF, 2NF, and 3NF, built to handle common data anomalies and keep data organized.",
  '66:en:131':
    'Follow these processes and the result is a normalized database that stays accurate and easy to manage in practice, not just on paper.',

  // ---------- POST 67 (diseno-bases-datos) — ES ----------
  '67:es:0':
    'El diseño de bases de datos es lo que decide si un sistema es fácil de mantener o una pesadilla en seis meses. Una base bien diseñada te da acceso rápido a datos precisos, y eso es lo que sostiene buenas decisiones. Todo parte de tres piezas: tablas, columnas y registros. Aquí reviso los principios y el proceso que sigo para llegar a un diseño que realmente funcione.',
  '67:es:2':
    'Un buen diseño de bases de datos es lo que hace que el manejo de la información funcione bien de entrada. Estos son los aspectos que sostienen esta disciplina.',
  '67:es:36':
    'El diseño lógico es la parte donde defines cómo se van a estructurar los datos de forma eficiente: un modelo que representa cómo se relacionan las tablas entre sí, cuidando integridad y eficiencia desde el arranque.',
  '67:es:199':
    'Aplicar buenas prácticas es lo que separa una base de datos que envejece bien de una que empieza a fallar en producción. Estas estrategias mantienen el sistema funcionando de forma óptima y protegen la calidad y seguridad de la información.',
  '67:es:225':
    'Una documentación clara facilita la colaboración y acorta la curva de aprendizaje de cualquiera que se sume al equipo, algo que en proyectos colaborativos marca la diferencia entre avanzar rápido o perder semanas explicando el esquema.',

  // ---------- POST 67 — EN ----------
  '67:en:0':
    'Database design decides whether a system is easy to maintain or a nightmare six months in. Understand the key principles and best practices, and you can build a database that actually holds up to what your organization needs.',
  '67:en:1':
    'Here I go through the core concepts, the design principles I actually use, and where design tools fit into modern data architecture.',
  '67:en:3':
    "Designing a database means deciding how data gets stored, organized, and retrieved, and getting that right is most of the battle. This section covers the key properties databases need, the different DBMS architectures, and the data models you'll actually use.",
  '67:en:108':
    'AI and machine learning are already changing how databases get designed, mostly through automation and optimization. These technologies can analyze data patterns to inform design decisions and improve how a database is managed overall. Automating routine tasks like indexing, query optimization, and load balancing improves ',
  '67:en:109':
    " and cuts down on maintenance overhead. AI-driven insights can also lead to better schema design, with structures that adapt as user behavior and data patterns change. As these technologies mature, combining design tools with AI capabilities will matter more for building database systems that hold up over time.",

  // ---------- POST 68 (arboles-binarios) — ES ----------
  '68:es:0': 'Para mí, los árboles binarios son de las ',
  '68:es:1':
    ' más útiles que existen. Cada nodo tiene como máximo dos hijos, y esa simple regla jerárquica alcanza para organizar información de forma muy eficiente. Los uso todo el tiempo: para optimizar búsquedas y ordenaciones, para construir índices en ',
  '68:es:2': ' o para representar expresiones dentro de un compilador. Entender bien sus tipos y operaciones es la base de ',
  '68:es:3':
    ', y abre la puerta a soluciones elegantes para problemas que de otra forma serían un dolor de cabeza.',
  '68:es:4':
    'En corto: un árbol binario organiza datos de forma jerárquica, cada nodo con hasta dos hijos, y eso te da búsquedas, inserciones y eliminaciones en O(log N) cuando usas un Árbol Binario de Búsqueda (BST). Los árboles balanceados (AVL, rojinegros) evitan que esa eficiencia se degrade a O(N). Y los recorridos (preorden, inorden, postorden, por niveles) son la forma de procesar esos datos, algo que usan desde motores de bases de datos hasta compiladores.',
  '68:es:6': 'Los árboles binarios son la base de otras ',
  '68:es:7': ' más avanzadas. Entender bien su anatomía y cómo operan es el primer paso para usarlos con criterio.',
  '68:es:37':
    'Estas son las características que definen qué tan eficiente y aplicable resulta un árbol binario:',
  '68:es:273':
    'Los árboles binarios, y sus primos más generales los B-trees, no son curiosidad académica. Están debajo de un montón de sistemas críticos, y su eficiencia se nota directamente en el rendimiento, la escalabilidad y la fiabilidad del software que corre encima.',
  '68:es:307':
    'Que los árboles binarios estén en todas partes de la informática moderna dice mucho de lo bien que funcionan.',
  '68:es:346':
    'Dominar los árboles binarios no es solo aprender una estructura de datos más. Es entender cómo organizar y manipular información de forma eficiente, algo que vas a usar constantemente como ingeniero de software.',

  // ---------- POST 68 — EN ----------
  '68:en:0':
    "Binary trees are one of the data structures I reach for constantly. Each node has at most two children, and that simple rule is enough to organize data efficiently, whether you're working in C++ or any other language.",
  '68:en:1':
    'Here I go through the main types of binary trees, their core algorithms, and where they actually get used in practice.',
  '68:en:76':
    "Debugging matters a lot here, especially with a structure as easy to get subtly wrong as a binary tree. Most errors come from mismanaged pointers, bad node links, or misreading the recursive logic. Print statements that trace execution flow help a lot. Testing edge cases systematically, like inserting duplicate values or deleting nodes that don't exist, tends to surface the bugs that hide otherwise. Solid debugging skills combined with a real understanding of how binary trees behave will maximize the efficiency of ",
  '68:en:112':
    "Stanford's CS Education Library is also worth a look. It's free, covers tree algorithms, recursion, and advanced data structures, and works well whether you're just starting out or brushing up your skills.",
}
