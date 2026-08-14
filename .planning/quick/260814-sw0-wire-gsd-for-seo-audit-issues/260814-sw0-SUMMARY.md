---
phase: quick-260814-sw0
plan: 01
subsystem: tooling-seo
tags: [seo, gsd, tooling, validation]
status: complete
requires: []
---

# Wiring de GSD para los 11 issues de la auditoria SEO

## Que se hizo

Tres scripts bajo `scripts/seo/`. Cero cambios en codigo de la aplicacion.

### `validate.sh`

Un validador por issue, contra `https://juan-tech.com`. Uso: `./scripts/seo/validate.sh 2`,
`./scripts/seo/validate.sh 1 2 4`, `./scripts/seo/validate.sh all`. Exit 0 si todo pasa,
1 si algo falla.

Cada check imprime el valor medido junto al esperado, asi que la salida sirve
directamente como evidencia de cierre sin reformatear nada.

### `validate-a11y.py`

Lee los reportes de unlighthouse y valida los tres audits de accesibilidad del
issue #10 (`aria-valid-attr-value`, `heading-order`, `image-redundant-alt`).
De paso imprime el resumen de performance del issue #6 comparado contra el
baseline, porque ambos issues se validan con la misma corrida y no tiene sentido
pagar dos veces los 62 reportes de Lighthouse.

### `issue.sh`

El driver del ciclo:

| Comando | Que hace |
|---|---|
| `prompt N` | imprime el prompt de `/gsd:quick` listo para pegar |
| `start N` | crea `seo/NN-slug` desde master y muestra el prompt |
| `pr N` | push + PR contra master |
| `close N` | valida contra live, etiqueta, comenta la evidencia y cierra |
| `status` | tabla de los 11 issues con estado y si existe su rama |

`close` se niega a cerrar si la validacion falla. En rojo pone la label
`needs-validation` y comenta el output; en verde pone `validated`, comenta y
cierra. El cierre nunca depende de que alguien lea bien una salida.

## Verificacion

Lo importante era probar que el validador da **rojo** hoy. Un validador que pasa
contra un sitio roto no sirve de nada.

Corrida real contra produccion, 2026-08-14:

```
=== SEO-01: Texto [PLACEHOLDER] en las 4 landings locales ===
  FAIL  sin placeholders en /seo-tecnico-madrid (medido: 14, esperado: 0)
  FAIL  sin placeholders en /en/seo-tecnico-madrid (medido: 14, esperado: 0)
  FAIL  sin placeholders en /seo-tecnico-lima (medido: 10, esperado: 0)
  FAIL  sin placeholders en /en/seo-tecnico-lima (medido: 10, esperado: 0)

=== SEO-03: Identidad ===
  FAIL  sin el handle incorrecto en / (medido: 2, esperado: 0)
  FAIL  sin credenciales con fecha futura (medido: 1, esperado: 0)
  FAIL  el Person de la home sigue sin sameAs

=== SEO-02: Hreflang ===
  FAIL  /servicios sigue apuntando a /en/servicios (slug sin traducir)
  FAIL  URL fantasma /services sigue respondiendo 200
  PASS  regresion: / conserva su hreflang (= 3, ge 3)
  PASS  regresion: /blog/seo conserva su hreflang (= 3, ge 3)
  PASS  regresion: /case-studies/... conserva su hreflang (= 3, ge 3)

EXIT: 1
```

Los conteos coinciden exactamente con el baseline de la auditoria (14/14/10/10),
los defectos conocidos dan rojo y los checks de regresion dan verde. Eso es lo
que valida al validador.

`bash -n` y `py_compile` pasan en los tres scripts.

## Un bug que valio la pena

La primera version usaba `grep -oc` para contar placeholders y reportaba **1**
donde el baseline decia 14. `grep -c` cuenta lineas coincidentes, no ocurrencias,
y el HTML de Next viene practicamente en una sola linea. El check habria pasado a
verde apenas quedara un placeholder suelto en lugar de catorce.

Se reemplazo por un helper `count()` que hace `grep -oiE | wc -l`. Quedo
comentado en el script porque es el tipo de error que vuelve.

## Decisiones

**`--full` solo en dos issues.** #5 (canibalizacion) borra contenido de forma
irreversible y necesita mirar GSC antes de elegir que URL sobrevive. #6
(performance) toca fuentes, middleware de locale y `next.config` a la vez. Los
otros nueve tienen causa raiz ya diagnosticada y alcance acotado, asi que quick
alcanza. La razon se imprime en el prompt.

**Los checks de regresion viven junto a los del fix.** El validador del #2 no
solo verifica que el hreflang de servicios quede bien, tambien que el de blog,
case-studies y home siga intacto. Un fix de hreflang mal generalizado rompe las
plantillas que hoy funcionan, y esa falla es la mas cara de detectar tarde.

**La lista del #5 queda marcada como ajustable.** Cual URL gana cada grupo se
decide con datos de GSC, no desde el script. El validador lo dice en su propia
salida en vez de asumir un ganador.

## Lo que no cubre

- El efecto real del #5 sobre ranking. Se valida que los 301 esten en pie, pero
  el resultado se mide a 8-12 semanas contra el conteo de keywords organicas
  (hoy: 1).
- Los checks de Lighthouse necesitan la corrida de unlighthouse aparte. No se
  metio dentro de `validate.sh` porque tarda varios minutos y no tiene sentido
  pagarlo cuando se valida un issue de contenido.
- El deploy no se detecta solo. `close` avisa de esperarlo, pero no lo verifica.
  Si Dokploy expone un endpoint de estado, ahi hay una mejora.

## Como se usa

```bash
./scripts/seo/issue.sh start 2      # crea la rama, imprime el prompt de GSD
# ... resolver con GSD ...
./scripts/seo/issue.sh pr 2         # PR contra master
# ... mergear, esperar el deploy de Dokploy ...
./scripts/seo/issue.sh close 2      # valida, etiqueta, comenta y cierra
```
