# Handoff del corte de la fase 56 a la fase 57

Este documento es el insumo del gate de la fase 57. Dice qué se carga en el corte, en qué orden, quién aprueba cada escritura, cómo se regresa y qué decisiones siguen abiertas. Lo escribí al cerrar el plan 56-14, con el estado que el gate de decisiones tenía ese día.

El cargador del corte es `scripts/db/28-phase56-cutover-load.ts`. En la fase 56 solo se corrió en seco y con una Local API falsa. Nadie lo ejecutó con `--apply`, y no debe ejecutarse con `--apply` antes del corte: master ya lee estos datos y un guardado en su admin puede borrar las lecciones.

## Qué se carga en el corte

El cargador lee `CUTOVER_ITEMS` (46 items en `scripts/db/data/56-cutover-data.ts`). Cada item trae su valor actual como respaldo, su estado y su gate.

| Carga | Items | Destino en Payload | Por qué espera al corte |
|---|---|---|---|
| Lecciones | 21, en 7 casos | `case-studies.lessons`, ES y EN | El admin de master no conoce el campo y un guardado allí puede borrarlas (D-03) |
| Alt de capturas | 6 (5 cargables, la de Juan Tech espera recaptura) | `media.alt`, ES y EN | Master también lee esos docs de Media (D-02) |
| Filas de Websites | Arianna Lupi stack, Juan Tech, Aprendoclub. Apturio no cambia. Loops Growth no se crea | `websites` (stack, highlights, challenges) | Master sirve esas filas hoy |
| Autor | 1: `endDate` de AprendoSEO pasa a vacío | `authors.experience` | Master sirve esa fila hoy |
| Testimonio | 0 cambios con la opción por defecto (dejar) | `testimonials` | Master lee la colección, un testimonio nuevo sale en caliente |
| Botón del header | 1, aprobado | `header.ctaButton.label`, ES y EN | Master lee ese global |
| Fecha legal | 1 | `legal-pages.effectiveDate` | Un único valor, fijado el día del corte (D-09) |

El cargador no escribe estos items y los lista como MANUAL:

- Los encabezados que master sirve (5 grupos `heading-master`). Los legales numerados dejan de servirse cuando el merge pone la ruta que lee el texto sombra. Los de servicios, stack, home y búsqueda afectan al SEO y esperan decisión de Juan.
- Los CTA que viven en código o dentro de bloques de docs pages (`audit-offer-cta`, `auditor-cta`, landings de servicio). Los que viven en `messages` y en componentes viajan con el merge.
- La traducción EN completa de recursividad. Si Juan elige traducir, se planea aparte con `/gsd-plan-phase 56 --gaps`. El cargador aborta si esa decisión queda en `traducir`.

## Orden exacto del corte

Cada paso con base de datos es un `checkpoint:human-action` de Juan, con el formato de 54-07 y 55-06: túnel en la terminal A, `DATABASE_URI` sacada en vivo por ssh, pre-flight, `04-which-database.ts`, dry-run, respaldo y recién entonces `--apply`. Claude no abre el túnel. Ningún comando usa `--env-file=.env` y nadie teclea la clave.

1. Gate en verde. `node_modules/.bin/tsx scripts/verify/56-gate.ts --gate` debe salir 0. Hoy sale 1 con 70 problemas (ver la lista más abajo). Cada respuesta de Juan se pasa a `aprobado` en el archivo de datos que corresponde y se registra en un commit.
2. Antes del merge, en la sombra, que no afecta a master: cerrar el checkpoint de 56-12 (migración `phase56_legal_shadow`, siembra ES de home, about y legal) y, con HOME-EN, ABOUT-EN y los cuatro documentos legales aprobados, sembrar el EN con `--include-en`.
3. El día del merge, fijar `LEGAL_EFFECTIVE_DATE` en `scripts/db/data/56-legal-copy.ts` con la fecha de ese día (AAAA-MM-DD) y hacer commit. El cargador se niega si el valor está vacío o a más de un día de hoy. `56-cutover-selftest.ts` exige que el item legal pase a `aprobado` con ese mismo valor.
4. Merge a master y despliegue por Dokploy (lo hace la fase 57). Esperar a que el sitio nuevo responda sano antes de cargar.
5. Preparar la sesión de Juan: terminal A `./scripts/db/tunnel.sh`. Terminal B, en la raíz del repo:
   - `export DATABASE_URI="$(ssh -i ~/.ssh/sapling_ed25519 juan@116.203.79.125 'CID=$(sudo docker ps --filter name=app-program-online-alarm -q); sudo docker exec "$CID" printenv DATABASE_URI' | sed 's#@shared-postgres:5432#@127.0.0.1:15432#; s#$#?sslmode=disable#')"`
   - `export PAYLOAD_SECRET=migrate-only` y `export NEXT_PUBLIC_SERVER_URL=https://juan-tech.com`
   - Pre-flight: `node -e "const u=new URL(process.env.DATABASE_URI);console.log(u.username,u.hostname,u.port,u.pathname,u.search)"`. Debe imprimir `<usuario> 127.0.0.1 15432 /juantech ?sslmode=disable`. Si no, parar.
   - `node_modules/.bin/tsx scripts/db/04-which-database.ts`. Si el host o la base no son los de arriba, o los valores testigo no coinciden con el sitio, parar.
6. Respaldo fresco fuera del repo: `node_modules/.bin/tsx scripts/db/28-phase56-cutover-load.ts --print-current > ~/respaldo-fase56-corte-AAAAMMDD.json`. Solo trae copy público.
7. Dry-run: `node_modules/.bin/tsx scripts/db/28-phase56-cutover-load.ts`. Revisar que ningún item diga `SE NIEGA` o `PENDIENTE`, que no aparezca `DRIFT` sin explicación y que el diff coincida con lo aprobado.
7b. Capturas (nuevo, 2026-11-15). Con el sitio ya desplegado, repite el dry-run `node_modules/.bin/tsx scripts/db/32-phase56-replace-captures.ts` y luego `--apply --db-checked`. Reemplaza el archivo y deja el alt ES y EN de Juan Tech, Arianna Lupi, Dr. Vargas y Estylopia con las recapturas de `.planning/phase-56-prep/captures/`. Si la home de Juan Tech cambia entre hoy y el corte, recaptura antes `juan-tech-com.png`. Las imágenes anteriores están en `~/respaldo-capturas-fase56/` (Cloudinary sobrescribe la misma ruta).
8. Carga sin pasos destructivos, con `--apply --db-checked` y `--only` para lecciones, alt, autor, testimonio, botón del header, filas de Websites que solo crecen y la fecha legal: `node_modules/.bin/tsx scripts/db/28-phase56-cutover-load.ts --apply --db-checked --only lessons media-alt CUT-websites-juan-tech-com CUT-websites-aprendoclub-com author testimonial CUT-cta-master-header-cta legal-date`. El botón del header se elige por id porque `--only cta-master` también trae `audit-offer-cta`, que sigue pendiente y haría abortar la corrida. La fecha legal va al final de la misma corrida porque el cargador la ordena última.
9. Cargas destructivas, cada una con la frase de Juan (ver la tabla de aprobaciones): el recorte del stack de Arianna con `--allow-shrink-rows`, y las lecciones con `--overwrite-lessons` solo si un caso ya trae lecciones distintas.
10. Esperar el TTL de 60 s del `unstable_cache` y verificar contra el HTML servido, no contra el OK del cargador: `node scripts/verify/56-cases-lessons-live.mjs --expect-loaded` y `node scripts/verify/56-legal-live.mjs --expect-date`. Después correr la batería viva completa de la 56 contra producción.
11. Cerrar: Ctrl-C en la terminal A (el túnel borra el relay solo) y `unset DATABASE_URI PAYLOAD_SECRET NEXT_PUBLIC_SERVER_URL`.

## Quién aprueba cada escritura

El cargador se niega a aplicar un item pendiente o propuesto con gate aprobado. Con `--apply`, si entre los items elegidos queda uno sin aprobar, aborta antes de la primera escritura. Un item propuesto con gate propuesto sí se aplica y el cargador lo anota para este handoff.

| Escritura | Efecto | Aprobación que se exige |
|---|---|---|
| 21 lecciones | Sección nueva en los 7 casos, visible en master | Juan aprueba por escrito las 21 (estado `aprobado`) |
| Lecciones sobre lecciones existentes (`--overwrite-lessons`) | Pisa texto | Juan nombra el caso. Se aplica solo tras leer el respaldo del caso |
| Alt de 5 capturas | Cambia el alt que master sirve en Websites y en la home | Juan aprueba cada alt (estado `aprobado`) |
| Stack de Juan Tech y Aprendoclub | Cambia tags y una línea de highlights que master sirve | Juan aprueba el stack propuesto y resuelve la duda de Neon |
| Recorte del stack de Arianna (4 a 2 tags, `--allow-shrink-rows`) | Quita 2 filas. Destructivo | Juan escribe "apruebo recortar el stack de ariannalupi-com de 4 a 2 tags" tras leer el DESCARTA del dry-run |
| Highlights y retos de Arianna | Texto nuevo que master sirve | Juan dicta el texto en ES y EN. Sin eso el item bloquea el gate |
| Fila de autor (`endDate` a vacío) | Cambia una fecha que master sirve | Juan aprueba el item |
| Cita de Patricia Ibarra | Visible en producción en caliente | Solo si Juan elige `confirmo` y pega las dos citas reales |
| Botón del header | Ya aprobado. Cambia el texto del botón que master muestra | Aprobado en el lote 1 de CTAs |
| Fecha legal | Muestra la fecha efectiva en privacidad y términos | Juan confirma el día del corte. El cargador exige que esté a un día o menos de hoy |

## Vía de regreso

- Antes de escribir, el cargador imprime el valor actual de cada item (`respaldo antes de escribir`), y el paso 6 guarda el mismo respaldo completo en un JSON fuera del repo.
- El cargador no trae un modo de restauración. Para revertir hay tres caminos, del más cómodo al más pesado:
  1. `websites` y `case-studies` guardan versiones en Payload (borradores con hasta 50 versiones por doc). Restaurar la versión anterior desde la pestaña Versions del admin deshace filas de Websites y lecciones.
  2. `media`, `authors`, `testimonials`, `header` y `legal-pages` no tienen versiones. Se vuelve a escribir a mano el valor del JSON de respaldo, o se repite el cargador con los datos viejos.
  3. Restaurar un volcado de la base `juantech`. En el repo no encontré evidencia de una rutina de volcados de `shared-postgres`, así que la fase 57 debe confirmar que existe uno reciente antes del corte. Es una confirmación pendiente.
- El texto sombra (globals `home-page`, `about-page` y `legal-pages`) se rehace desde el copy con `26-phase56-seed-shadow.ts` y `27-phase56-seed-legal.ts`, ambos con dry-run por defecto. Master no lee esos globals, así que revertirlos no cambia producción.
- El código se revierte con un revert del merge y un redespliegue de la imagen anterior en Dokploy. La fase 57 lo documenta.
- Las escrituras por script no invalidan el tag de `unstable_cache`. Un cambio o una reversión sale tras el TTL de 60 s. Un cambio que no se ve al instante no significa que falló.

## Decisiones de Juan

Estado del gate de decisiones al cerrar el plan 56-14: `56-gate.ts` sin banderas sale 0 con 14 avisos. `56-gate.ts --gate` sale 1 con 70 problemas.

Después de generar ese estado, Juan aceptó en bloque las recomendaciones de Claude (línea "Recomendaciones aceptadas en bloque por Juan (2026-11-10)" de `.planning/phase-56-prep/aprobaciones-juan.md`). Los archivos de datos todavía dicen `propuesto` o `pendiente`, así que el gate sigue contando esos items. Antes del paso 1 del corte hay que pasarlos a `aprobado` en un commit que cite esa línea.

**Aceptadas en bloque, falta pasarlas a `aprobado` en el registro**

- Alt de las 4 fotos y de las capturas. Ojo con dos casos: `ALT-juan-tech` no tiene texto cargable hasta recapturar el sitio, y si Juan recaptura Arianna Lupi, Dr. Vargas o Estylopia, hay que abrir la imagen nueva y revisar su alt antes de cargarlo. El alt se redactó mirando la captura vieja.
- Hechos legales con sus valores por defecto: `LEGAL-FACT-HOSTING` (región de Hetzner vacía hasta confirmar y registros del servidor a 30 días sujetos a verificar), `LEGAL-FACT-MAILBOX-PROVIDER` (buzón sin nombrar), `LEGAL-FACT-RETENTION-CONTACT-EMAIL` y `LEGAL-FACT-RETENTION-SUBSCRIBERS` (12 meses), `LEGAL-FACT-COOKIE-BANNER` (sin banner) y `LEGAL-FACT-GOVERNING-LAW` (Perú, con la Ley 29733 como supuesto).
- Encabezados que master sirve: `HEAD-servicios`, `HEAD-stack`, `HEAD-busqueda`, `HEAD-codefixes` y `HEAD-alcance` se dejan como están. Los legales se reemplazan al cortar (`HEAD-legal`).
- CTA: las tarjetas conservan "Ver servicio", el botón del header pasa a "Pedir auditoría 360" en el corte (es el item `CUT-cta-master-header-cta`) y los pasos de Contacto, "Pedir la auditoría", "Escribir un correo", "Enviar mensaje", "Enviarme el checklist" y "Suscribirme" quedan con su texto actual (`CTA-contact-step-1` a `3`, `CTA-audit-offer-cta`, `CTA-contact-write-email`, `CTA-contact-submit`, `CTA-emailcapture-submit`, `CTA-newsletter-submit` y su espejo `CTA-MAP-*`).
- `CUT-websites-ariannalupi-stack` (Astro y Cloudflare), `CUT-websites-loopsgrowth-com` (no crear fila) y `CUT-post-translation-recursividad` (mantener el aviso de traducción).

**Siguen sin respuesta**

- Las 21 lecciones, `LESSON-<caso>-<n>` en los 7 casos. Las cifras salen del texto de cada caso y `56-cases-lessons-live.mjs` las verifica en el HTML.
- `HOME-EN`, `ABOUT-EN`, `LEGAL-PRIVACY-EN` y `LEGAL-TERMS-EN`. Mientras sigan propuestos, `/en` y `/en/sobre-mi` muestran el aviso de traducción. `LEGAL-PRIVACY-ES` y `LEGAL-TERMS-ES` tampoco tienen aprobación escrita.
- `CUT-websites-ariannalupi-textos`: Juan dicta los highlights y los retos reales de Arianna Lupi, en ES y EN. Los vigentes cuentan una migración a Next.js y Payload que no corresponde a un sitio Astro. No se inventó ningún sustituto.
- `CUT-websites-juan-tech-com`: decidir si Cloudinary y Resend van como tags del stack o se quedan como servicios.
- Neon: `CUT-websites-aprendoclub-com` y `CUT-websites-apturio-com` dicen Neon Postgres y desde fuera no se puede verificar. Juan confirma si sigue siendo así.
- `CUT-testimonial-patricia-ibarra`: la ES dice "Trabajar con Juan fue lo mejor." y la EN "Working with Juan was the best decision we made." No dicen lo mismo. Juan dice cuál es la real. Un testimonio nuevo sale en producción al instante porque master lee la colección.
- `CUT-author-aprendoclub-experience`: el corte solo cambia la fecha de fin. Renombrar la empresa de AprendoSEO a aprendoclub en esa fila es decisión de Juan.
- `CUT-legal-date-efectiva`: se fija el día del corte.
- Fuera del cargador: el título original del post "Topic clusters SEO..." y la frase del recorte de etapas de Sobre mí junto con el "aplicado" de la migración, que son del checkpoint de 56-12.
- Apturio: la fila no cambia porque Hostinger se verifica por cabeceras. La premisa de que estaba desactualizada solo se sostiene para Juan Tech, Aprendoclub y Arianna Lupi.

## Textos propuestos que el cargador aplica y se anotan aquí

Con los valores por defecto de D-22, ningún item propuesto con gate propuesto escribe nada: `CUT-post-translation-recursividad` (no cambia contenido), `CUT-cta-master-landings-servicio` (dejar), `CUT-testimonial-patricia-ibarra` (dejar), `CUT-websites-apturio-com` (sin cambio) y `CUT-websites-loopsgrowth-com` (no crear) no traen `desired`. `HEAD-legal`, `HEAD-lecciones` y los seis `MSG-emailCapture-*` no pasan por el cargador: viajan con el merge. Si Juan elige una opción alternativa con texto (por ejemplo una cita nueva de Patricia Ibarra), el item se carga, el cargador lo imprime en el aviso final y esta lista lo registra.

## Nota legal D-10

No soy abogado. La revisión legal profesional de la política de privacidad y de los términos es opcional y queda para después del corte. Esta nota vive en el handoff y no va en el sitio.

## Notas de contenido fuera de alcance

- En el caso de migración, los periodos salen en inglés dentro de la página en español ("Después: After (90 days)").
- En el caso edtech la tabla dice impresiones +142 % y las Conclusiones dicen +141 %. No afecta a las lecciones, pero el caso se contradice.
- Las landings de Lima y Madrid conservan marcadores de relleno ocultos por la vista. Quedan como están.
- Un testimonio nuevo que Juan pegue en el admin aparece en producción en caliente, sin esperar al corte.
- Traducción EN de recursividad según la decisión de Juan, y los posts 9, 35 a 38, 56, 57 y 58 siguen sin EN (deuda previa).
- Idea para el contrato de encabezados: afinar la regla para que cuente solo un punto o una coma seguidos de espacio o fin de cadena. Hoy marca falsos positivos como ".js", "86,000" y "Dr.".

## Confirmación D-23

El `<title>` y la meta description de la home no cambian en el corte. `26-phase56-seed-shadow.ts` aborta si el copy trae `title`, `meta`, `slug`, `description` o `seo`, y la batería viva compara el title y la meta description de la home y de los legales contra producción con `55-seo-parity`.

## Verificación de la fase 56 al cerrar el plan 56-14

Autopruebas, sin red y sin base: `node scripts/verify/56-run-all.mjs --selftests --strict` sale 0 con 79 pasos PASS, 0 FAIL y 0 SKIP. Ya no queda ningún script de la fase en SKIP. `56-cutover-selftest.ts` suma 122 casos PASS, entre ellos el cargador completo contra una Local API falsa.

Batería viva contra el preview, solo lectura HTTP: `BASE_URL=https://dev.juan-tech.com PROD_BASE=https://juan-tech.com EXPECT_PREVIEW=1 node scripts/verify/56-run-all.mjs --live --no-wait --strict` sale 1 con 23 pasos PASS y 4 FAIL. Los cuatro fallos son de despliegue y no del cargador:

| Paso | Qué falla | Por qué |
|---|---|---|
| `56-no-marker-live` | Marcador de ranura en `/sobre-mi` y `/en/sobre-mi`, y aviso de traducción en `/en` | El preview sirve la compilación anterior a la fase 56 y el EN sombra no está sembrado |
| `56-cta-live` | 28 comprobaciones de CTA, incluida la frase retirada del cierre de la home | Misma causa: el preview no tiene el código ni el copy de la fase 56 |
| `56-legal-live` | Privacidad y términos siguen con Hostinger, Google Analytics y encabezados numerados | La ruta que lee el texto sombra no está desplegada y el global no está sembrado |
| `54-page-contract` (regresión de la 54) | Una aparición del marcador de ranura en `/sobre-mi` | Mismo marcador de Sobre mí |

El origen `feat/mui-redesign` lleva 49 commits de ventaja sobre lo que está en `origin`, y el checkpoint de 56-12 (migración y siembra sombra) sigue sin correr. Mientras eso no pase, esos cuatro pasos no pueden ponerse en verde. Los demás pasos vivos pasan, entre ellos `55-seo-parity` de home y legales (D-23), `56-cases-lessons-live` y toda la regresión de la 55.

Dry-run del cargador contra la base: pendiente del checkpoint de Juan (plan 56-14, tarea 4). Su salida se pega en este documento cuando llegue.


## Actualización 2026-11-15 (Juan dijo defaults y continúa con todo)

- Pasaron a `aprobado`: las 21 lecciones, HOME-EN, ABOUT-EN, los 4 textos legales, Websites (Arianna Lupi con Webflow a Astro, Juan Tech con Cloudinary y Resend como tags, aprendoclub, Apturio sin cambio), la fila de autor (AprendoSEO pasa a aprendoclub) y la cita de Patricia. El gate solo falla por `CUT-legal-date-efectiva`, que se fija el día del corte.
- Neon se conserva en aprendoclub y Apturio (Juan, 2026-11-14). Hetzner está en Helsinki y el texto legal lo dice.
- Patricia Ibarra: la cita quedó como "Trabajar con Juan fue la mejor decisión que tomamos." y la EN igual a la existente, sin hechos nuevos. Conviene que ella la confirme antes del corte porque va firmada con su nombre.
- Hecho en la base (aditivo): migración `phase56_legal_shadow`, siembra de home-page y legal-pages en ES y EN. Respaldos: `~/respaldo-fase56-sombra.json` y `~/respaldo-fase56-corte-20261115.json`.
- Falta: el recorte de etapas de about-page (5 a 4) y la siembra de about-page, que esperan la frase de Juan, y los pasos 8 y 13 de 56-12 con el rol del preview.
- El DRIFT en inglés de los 5 alt del simulacro es un artefacto de lectura (EN vacío contra respaldo con el ES por fallback), no un cambio real.
- El contenido SEO (títulos, redirects, landings, footer) ya está en producción desde el 2026-11-14. Ver `feat/seo-pilares`: mergearla en la fase 57. El footer "Guías clave" ya está en la base: confirmar que el diseño nuevo lo renderiza.

## Actualización 2026-11-16 (sombra completa y dev verificado)

- Juan escribió `apruebo recortar etapas de about-page de 5 a 4`. Se sembró about-page ES y EN con `--allow-shrink-stages` (descartó `experience.stages[4]`, el coach de mar 2025, ya presente en la etapa 4 del copy aprobado).
- Legal sombra (privacy y terms, ES y EN) sembrado. Dev servía el texto viejo por caché: se redesplegó `juantech-preview` y `56-legal-live` pasó 4 de 4.
- Dev verificado contra el HTML servido: `56-no-marker-live`, `56-cta-live` (14 rutas), `56-legal-live`, `54-page-contract`, `53-shell-contract`, `53-crawl-parity` (166 URLs, 0 diferencias), `55-seo-parity` con `EXPECT_PREVIEW=1` (156 de 156). Logs del preview: 0 `permission denied`, que cubre la intención de los pasos 8 y 13.
- Corrección: los 3 pasos del contacto se verifican en `/contact` (CTA_MAP), no en la home.
- Falla esperada hasta el corte: `54-about` en `/en/sobre-mi`. La foto no sale porque el alt EN del Media `p54-about-hero` (id 76) está vacío y `mapPhoto` exige alt. Lo carga el cargador 28 (item `about-hero`). Tras el corte, repetir `54-about`.
