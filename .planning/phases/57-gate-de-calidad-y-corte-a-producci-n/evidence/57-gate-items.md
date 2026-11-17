# 57-05: ítems abiertos del gate de decisiones de la 56

Fecha: 2026-11-17. Rama: `feat/mui-redesign` (base b31a6bc). La lista sale de una sola fuente (D-07): la salida vigente de `node_modules/.bin/tsx scripts/verify/56-gate.ts --gate`, sin base de datos. Nada de esta evidencia viene de una lista memorizada.

## Conteo del gate

| Momento | Fuente | Problemas con `--gate` | Sin banderas |
|---------|--------|------------------------|--------------|
| Antes del 2026-11-10 | handoff de la 56, "Siguen sin respuesta" | 21 lecciones, 6 de inglés y legal, 7 ítems CUT y 2 fuera del cargador | no aplica |
| Tras el commit 33c7a41 (aceptado en bloque el 2026-11-10) | handoff y commit | baja lo aceptado en bloque; el resto sigue abierto | no aplica |
| Tras f85744a, 3d58bf8, 4db5641 y 62c1b2f (chat del 14 al 16 de noviembre) | `aprobaciones-juan.md`, sección "Aprobaciones de Juan en el chat" | 1 | exit 0 |
| Corrida de este plan (2026-11-17, 17:26 UTC) | `56-gate.ts --gate` | **1** (`CUT-legal-date-efectiva`) | **exit 0** (lo informa como INFO) |

Cien filas en total: 89 en aprobado, 10 en propuesto con gate propuesto (WARN, no bloquean) y 1 en pendiente.

## Lo aceptado en bloque ya estaba en el registro

La tarea 1 pide pasar a aprobado lo que acepta la línea "Recomendaciones aceptadas en bloque por Juan (2026-11-10)" de `.planning/phase-56-prep/aprobaciones-juan.md`. El commit `33c7a41` ("feat(56): pasar a aprobado lo que Juan acepto en bloque el 2026-11-10") ya lo hizo: tocó `56-alt-texts.ts`, `56-cta-map.json`, `56-cutover-data.ts`, `56-headings-table.ts`, `56-juan-inputs.json` y `56-legal-copy.ts`. La corrida de hoy lo confirma fila por fila:

- Alts: las 10 filas `ALT-*` en aprobado. La salvedad de `ALT-juan-tech` se resolvió con la recaptura (commits 3d58bf8 y 4db5641; el script 32 reemplaza las capturas en el corte).
- Hechos legales: los seis `LEGAL-FACT-*` en aprobado (hosting en Helsinki, buzón, retención de contacto y de suscriptores, sin banner de cookies, ley aplicable).
- Encabezados: `HEAD-servicios`, `HEAD-stack`, `HEAD-busqueda`, `HEAD-codefixes` y `HEAD-alcance` en aprobado.
- CTAs: las 22 filas `CTA-*` en aprobado.
- `CUT-websites-ariannalupi-stack`, `CUT-websites-loopsgrowth-com` y `CUT-post-translation-recursividad` en aprobado.

Por eso este plan no cambia ningún archivo de datos: no queda nada aceptado en bloque sin pasar. Tampoco se aprobó nada de la lista "Siguen sin respuesta" del handoff sin la respuesta escrita de Juan del 14 al 16 de noviembre.

## Lo que sigue abierto

| Grupo | Ítem | Estado | Bloquea el corte | Pregunta exacta para Juan |
|-------|------|--------|------------------|---------------------------|
| Fecha legal | `CUT-legal-date-efectiva` | pendiente | Sí, con `--gate` | Ninguna. Juan ya eligió "el día del corte"; el plan del corte fija `LEGAL_EFFECTIVE_DATE` en `56-legal-copy.ts` justo antes del merge y el ítem pasa solo a aprobado. Queda abierto por diseño. |
| Testimonio | `CUT-testimonial-patricia-ibarra` | aprobado | No en el gate | ¿Patricia confirmó la cita optimizada "Trabajar con Juan fue la mejor decisión que tomamos." / "Working with Juan was the best decision we made."? Lleva su firma, así que Juan la confirma con ella antes del corte. |
| Propuestos sin cargador | `D-11-lead`, `CUT-cta-master-landings-servicio`, `HEAD-legal`, `HEAD-lecciones` y seis `MSG-emailCapture-*` | propuesto con gate propuesto | No (WARN) | Ninguna para el corte. Viajan con el merge o no escriben nada con los valores por defecto de D-22; el handoff de la 56 los anota. |

## Salida de `56-gate.ts --gate` (exit 1), corrida del 2026-11-17

Salida íntegra, sin recortes:

```
# Modulos de datos 56-*: 13 (56-about-copy.ts, 56-alt-texts.ts, 56-case-lessons.ts, 56-cta-lote1.ts, 56-cta-map.ts, 56-cutover-data.ts, 56-headings-table.ts, 56-home-copy.ts, 56-legal-copy.ts, 56-legal-lexical.ts, 56-messages-voice.ts, 56-options-home.ts, 56-seed-lib.ts)
id                                                            estado     gate       elegida             
------------------------------------------------------------  ---------  ---------  --------------------
D-11                                                          aprobado   aprobado   cuatro-etapas       
D-11-lead                                                     propuesto  propuesto  propuesta           
D-11-ingeniero                                                aprobado   aprobado   -                   
ABOUT-EN                                                      aprobado   aprobado   traduccion-fiel     
ALT-about-hero                                                aprobado   aprobado   propuesto           
ALT-home-about-taller                                         aprobado   aprobado   propuesto           
ALT-home-about-escritorio                                     aprobado   aprobado   propuesto           
ALT-home-about-retrato                                        aprobado   aprobado   propuesto           
ALT-apturio                                                   aprobado   aprobado   propuesto           
ALT-aprendoclub                                               aprobado   aprobado   propuesto           
ALT-ariannalupi                                               aprobado   aprobado   propuesto           
ALT-drmanuelvargashidalgo                                     aprobado   aprobado   propuesto           
ALT-estylopia                                                 aprobado   aprobado   propuesto           
ALT-juan-tech                                                 aprobado   aprobado   propuesto           
LESSON-pittsburgh-criminal-defense-legal-content-seo-1        aprobado   aprobado   -                   
LESSON-pittsburgh-criminal-defense-legal-content-seo-2        aprobado   aprobado   -                   
LESSON-pittsburgh-criminal-defense-legal-content-seo-3        aprobado   aprobado   -                   
LESSON-fabricante-baldosa-hidraulica-seo-espana-1             aprobado   aprobado   -                   
LESSON-fabricante-baldosa-hidraulica-seo-espana-2             aprobado   aprobado   -                   
LESSON-fabricante-baldosa-hidraulica-seo-espana-3             aprobado   aprobado   -                   
LESSON-immigration-law-atlanta-seo-1                          aprobado   aprobado   -                   
LESSON-immigration-law-atlanta-seo-2                          aprobado   aprobado   -                   
LESSON-immigration-law-atlanta-seo-3                          aprobado   aprobado   -                   
LESSON-talleres-costura-miami-lanzamiento-seo-local-1         aprobado   aprobado   -                   
LESSON-talleres-costura-miami-lanzamiento-seo-local-2         aprobado   aprobado   -                   
LESSON-talleres-costura-miami-lanzamiento-seo-local-3         aprobado   aprobado   -                   
LESSON-urologo-seo-local-salud-santiago-rd-1                  aprobado   aprobado   -                   
LESSON-urologo-seo-local-salud-santiago-rd-2                  aprobado   aprobado   -                   
LESSON-urologo-seo-local-salud-santiago-rd-3                  aprobado   aprobado   -                   
LESSON-edtech-financiera-infantil-crecimiento-organico-seo-1  aprobado   aprobado   -                   
LESSON-edtech-financiera-infantil-crecimiento-organico-seo-2  aprobado   aprobado   -                   
LESSON-edtech-financiera-infantil-crecimiento-organico-seo-3  aprobado   aprobado   -                   
LESSON-migracion-ecommerce-nextjs-seo-tecnico-1               aprobado   aprobado   -                   
LESSON-migracion-ecommerce-nextjs-seo-tecnico-2               aprobado   aprobado   -                   
LESSON-migracion-ecommerce-nextjs-seo-tecnico-3               aprobado   aprobado   -                   
CTA-hero-cta                                                  aprobado   aprobado   aprobado            
CTA-services-cta                                              aprobado   aprobado   aprobado            
CTA-cierre-titulo                                             aprobado   aprobado   aprobado            
CTA-cierre-lead                                               aprobado   aprobado   aprobado            
CTA-cases-cta                                                 aprobado   aprobado   aprobado            
CTA-sites-cta                                                 aprobado   aprobado   aprobado            
CTA-contact-step-1                                            aprobado   aprobado   aprobado            
CTA-contact-step-2                                            aprobado   aprobado   aprobado            
CTA-contact-step-3                                            aprobado   aprobado   aprobado            
CTA-header-cta                                                aprobado   aprobado   aprobado            
CTA-audit-offer-cta                                           aprobado   aprobado   aprobado            
CTA-auditor-cta                                               aprobado   aprobado   aprobado            
CTA-services-index-talk                                       aprobado   aprobado   aprobado            
CTA-service-card-cta                                          aprobado   aprobado   aprobado            
CTA-auditor-notice-cta                                        aprobado   aprobado   aprobado            
CTA-stack-tool-link                                           aprobado   aprobado   aprobado            
CTA-stack-amazon                                              aprobado   aprobado   aprobado            
CTA-contact-response-note                                     aprobado   aprobado   aprobado            
CTA-contact-write-email                                       aprobado   aprobado   aprobado            
CTA-contact-submit                                            aprobado   aprobado   aprobado            
CTA-emailcapture-submit                                       aprobado   aprobado   aprobado            
CTA-newsletter-submit                                         aprobado   aprobado   aprobado            
CUT-websites-ariannalupi-stack                                aprobado   aprobado   propuesto           
CUT-websites-ariannalupi-textos                               aprobado   aprobado   propuesto           
CUT-websites-juan-tech-com                                    aprobado   aprobado   propuesto           
CUT-websites-apturio-com                                      aprobado   propuesto  sin-cambio          
CUT-websites-aprendoclub-com                                  aprobado   aprobado   propuesto           
CUT-websites-loopsgrowth-com                                  aprobado   propuesto  no-crear            
CUT-testimonial-patricia-ibarra                               aprobado   aprobado   propuesto           
CUT-author-aprendoclub-experience                             aprobado   aprobado   propuesto           
CUT-post-translation-recursividad                             aprobado   propuesto  aviso               
CUT-legal-date-efectiva                                       pendiente  aprobado   dia-del-corte       
CUT-cta-master-landings-servicio                              propuesto  propuesto  dejar               
HEAD-alcance                                                  aprobado   aprobado   39-reales           
HEAD-legal                                                    propuesto  propuesto  reemplazar-al-cortar
HEAD-lecciones                                                propuesto  propuesto  resuelta            
HEAD-codefixes                                                aprobado   aprobado   no-tocar            
HEAD-servicios                                                aprobado   aprobado   no-tocar            
HEAD-stack                                                    aprobado   aprobado   no-tocar            
HEAD-busqueda                                                 aprobado   aprobado   no-tocar            
HOME-EN                                                       aprobado   aprobado   traduccion-fiel     
LEGAL-PRIVACY-ES                                              aprobado   aprobado   propuesto           
LEGAL-PRIVACY-EN                                              aprobado   aprobado   propuesto           
LEGAL-TERMS-ES                                                aprobado   aprobado   propuesto           
LEGAL-TERMS-EN                                                aprobado   aprobado   propuesto           
LEGAL-FACT-HOSTING                                            aprobado   aprobado   propuesto           
LEGAL-FACT-MAILBOX-PROVIDER                                   aprobado   aprobado   propuesto           
LEGAL-FACT-RETENTION-CONTACT-EMAIL                            aprobado   aprobado   propuesto           
LEGAL-FACT-RETENTION-SUBSCRIBERS                              aprobado   aprobado   propuesto           
LEGAL-FACT-COOKIE-BANNER                                      aprobado   aprobado   propuesto           
LEGAL-FACT-GOVERNING-LAW                                      aprobado   aprobado   propuesto           
MSG-emailCapture-description                                  propuesto  propuesto  -                   
MSG-emailCapture-alreadyBody                                  propuesto  propuesto  -                   
MSG-emailCapture-errorBody                                    propuesto  propuesto  -                   
MSG-emailCapture-privacyPrefix                                propuesto  propuesto  -                   
MSG-emailCapture-privacySuffix                                propuesto  propuesto  -                   
MSG-emailCapture-pendingBody                                  propuesto  propuesto  -                   
D-22a                                                         aprobado   aprobado   A                   
D-22b                                                         aprobado   aprobado   2                   
D-22c                                                         aprobado   aprobado   ninguna             
D-22d                                                         aprobado   aprobado   2                   
D-22e                                                         aprobado   aprobado   3                   
D-22f                                                         aprobado   aprobado   2                   
D-22g                                                         aprobado   aprobado   3                   
D-22g-item                                                    aprobado   aprobado   1                   
WARN D-11-lead: propuesto con gate propuesto (Lead de la seccion Experiencia (sin la afirmacion del mismo equipo)); anotar en el handoff
WARN CUT-cta-master-landings-servicio: propuesto con gate propuesto (CTA landings-servicio (lo lee master)); anotar en el handoff
WARN HEAD-legal: propuesto con gate propuesto (Encabezados numerados de privacidad y términos (25)); anotar en el handoff
WARN HEAD-lecciones: propuesto con gate propuesto (Encabezados de las lecciones nuevas (2)); anotar en el handoff
WARN MSG-emailCapture-description: propuesto con gate propuesto (Mensaje emailCapture.description); anotar en el handoff
WARN MSG-emailCapture-alreadyBody: propuesto con gate propuesto (Mensaje emailCapture.alreadyBody); anotar en el handoff
WARN MSG-emailCapture-errorBody: propuesto con gate propuesto (Mensaje emailCapture.errorBody); anotar en el handoff
WARN MSG-emailCapture-privacyPrefix: propuesto con gate propuesto (Mensaje emailCapture.privacyPrefix); anotar en el handoff
WARN MSG-emailCapture-privacySuffix: propuesto con gate propuesto (Mensaje emailCapture.privacySuffix); anotar en el handoff
WARN MSG-emailCapture-pendingBody: propuesto con gate propuesto (Mensaje emailCapture.pendingBody); anotar en el handoff
FAIL CUT-legal-date-efectiva: estado pendiente (Fecha efectiva de la politica de privacidad y de los terminos (el dia del corte)); Juan debe responder antes del corte
FAIL 56-gate: 1 problema(s) impiden el corte
```

Sin banderas, la misma corrida sale con exit 0 y cambia el FAIL de `CUT-legal-date-efectiva` por `INFO`.

## Respuestas de Juan al checkpoint de la tarea 2 (2026-11-17)

Los puntos 1 a 10 ya tenían respuesta escrita del 14 al 16 de noviembre y están en `.planning/phase-56-prep/aprobaciones-juan.md`, sección "Aprobaciones de Juan en el chat (2026-11-14 al 2026-11-16)", con los registros tipados en los commits f85744a, 3d58bf8, 4db5641 y 62c1b2f. La corrida del gate de arriba lo confirma: ninguno de esos ítems sigue abierto. No se volvieron a preguntar.

| # | Ítem | Respuesta | Dónde quedó |
|---|------|-----------|-------------|
| 1 | 21 lecciones | aprobadas ("continua con todo") | `56-case-lessons.ts`, f85744a |
| 2 | HOME-EN y ABOUT-EN | aprobadas | `56-home-copy.ts`, `56-about-copy.ts`, f85744a |
| 3 | Cuatro legales | aprobados; revisión profesional opcional y posterior | `56-legal-copy.ts`, f85744a |
| 4 | Textos de Arianna Lupi | Webflow a Astro para bajar costos y ganar velocidad, redactado en ES y EN | `56-cutover-data.ts`, f85744a |
| 5 | Stack de Juan Tech | stack completo ("si pon toda esas tecnologias") | `56-cutover-data.ts`, f85744a |
| 6 | Neon en aprendoclub y Apturio | sigue en uso | `56-cutover-data.ts`, f85744a |
| 7 | Patricia Ibarra | cita optimizada "Trabajar con Juan fue la mejor decisión que tomamos." / "Working with Juan was the best decision we made."; Patricia la confirma antes del corte | `56-cutover-data.ts`, f85744a |
| 8 | AprendoSEO en la fila de autor | se renombra a aprendoclub | `56-cutover-data.ts`, f85744a |
| 9 | Título de "Topic clusters SEO" | se queda igual | `aprobaciones-juan.md` |
| 10 | Recaptura de las 4 capturas | Claude las recapturó; el script 32 las carga en el corte | 3d58bf8, 4db5641, `scripts/db/32-phase56-replace-captures.ts` |

## Decisiones de la fase 57

Juan las aprobó en el chat el 2026-11-17 ("esta bien eso que me dices. has todo eso"). Dejan de ser supuestos.

| # | Decisión | Valor | Supuesto que cierra | Quién lo consume |
|---|----------|-------|---------------------|------------------|
| 11 | Tolerancia de rendimiento del preview contra producción | 10%: mediana del preview menor o igual a 1,10 veces la de producción en LCP, TTFB y TBT; CLS menor o igual al mayor entre el de producción y 0,1 | A4 | `PERF_TOLERANCE=0.1` por defecto en el script de rendimiento de 57-03; el reporte de 57-08 lo cita |
| 12 | Umbral de disco del VPS antes de cada build | menos de 80% de uso y más de 15 GB libres | A9 | `scripts/verify/57-vps-disk-check.mjs` de 57-01 ya trae `DISK_MAX_PCT=80` y `DISK_MIN_FREE_GB=15` por defecto; solo su texto de "supuesto A9" quedó viejo |
| 13a | Tolerancia de palabras indexables | 2% | A4 | `WORDS_TOLERANCE=0.02` por defecto en `57-seo-parity-all.mjs` de 57-02 |
| 13b | Presupuesto de HTML sin comprimir del perfil de autor | 500 KB | A4 | presupuesto de F5 en `57-seo-parity-all.mjs` de 57-02 |
| 14 | Pista de tema del admin | quitar Accept-CH, Vary y Critical-CH con Sec-CH-Prefers-Color-Scheme del sitio público y conservarlas solo en `/admin/:path*` | A1 | 57-06 (F2): además del filtro sobre `/:path*`, agrega la regla separada para `/admin/:path*` |
| 15 | `scripts/_tmp-dump-b0303.ts` y `scripts/_tmp-extract-b0303.ts` | borrar | ninguno | el orquestador los borró el 2026-11-17; no estaban versionados, así que ningún commit los toca |
| 16 | Fecha de corte D | 2026-12-01 como propuesta, antes si el gate queda en verde | D-15 | 57-09 y siguientes; no es compromiso |

Este plan no cambia ningún script: los planes 57-01 a 57-03 y 57-06 ya traen o van a traer estos valores como variables de entorno por defecto.

## Checkpoint de la tarea 4: migración aditiva y siembra sombra

Quedó resuelto antes de este plan, con evidencia de la 56:

- 2026-11-15: Juan aplicó la migración `20261110_220805_phase56_legal_shadow` (aditiva, solo CREATE y ADD) contra la base de producción por el túnel, y `25-phase56-verify-schema.ts` la verificó.
- 2026-11-15: siembra sombra de home-page y legal-pages en ES y EN.
- 2026-11-16: siembra de about-page en ES y EN, después de que Juan escribió exacto "apruebo recortar etapas de about-page de 5 a 4".
- 2026-11-16 y 17: dev verificado en vivo contra el HTML servido (commit 62c1b2f).

Recomprobación de este plan, solo GET, 2026-11-17 a las 17:25 UTC, con `BASE_URL=https://dev.juan-tech.com PROD_BASE=https://juan-tech.com EXPECT_PREVIEW=1`:

| Verificador | Exit | PASS | FAIL |
|-------------|------|------|------|
| `56-no-marker-live.mjs` | 0 | 20 | 0 |
| `56-cta-live.mjs` | 0 | 15 | 0 |
| `56-legal-live.mjs` | 0 | 5 | 0 |

Autopruebas sin red: `56-cutover-selftest.ts` exit 0 y `56-content-guard.mjs --scripts` PASS (4 scripts revisados).
