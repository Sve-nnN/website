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
