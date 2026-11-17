# 57-01: línea base del preview, disco del VPS y SEO-02

Fecha: 2026-11-17. Rama: `feat/mui-redesign`. Todas las lecturas fueron de solo lectura: ninguna escritura en la base, ninguna limpieza del VPS, ningún `--env-file`.

## Antes del push

El orquestador empujó la rama y limpió la caché de build del VPS antes de que arrancara este plan (Juan lo autorizó en el chat: "si limpia el disco"; `sudo docker builder prune -af` liberó 7.75 GB y dejó el disco en 73%). Por eso no quedó una foto del preview viejo antes del push. La referencia previa es la del handoff de la 56: 23 PASS y 4 FAIL de despliegue (56-no-marker-live, 56-cta-live, 56-legal-live y 54-page-contract).

Estado de git al arrancar:

- `git log origin/feat/mui-redesign..HEAD --oneline`: vacío (0 commits sin empujar; la investigación había medido 53 antes del push del orquestador)
- `git status --short`: 18 entradas sin versionar o modificadas fuera de este plan (`.planning/state.json`, `research/*`, `designs/*`, `founder/`, `reports/`, `scripts/_tmp-*`). No se tocaron.

### SEO-02: sitemap y llms sin cambios respecto a master

```
git diff --stat master...HEAD -- src/app/sitemap.xml src/app/sitemap.html src/app/llms.txt src/app/llms-full.txt src/lib/sitemap-data.ts
(salida vacía)
```

`git diff master...HEAD --name-only | grep -Ei "sitemap|llms"` tampoco devuelve nada. Los cinco archivos existen en la rama y no cambian.

### Disco del VPS (57-vps-disk-check, 16:57 UTC, con el build del preview en curso)

```
disco /: 75G total, 54G usados, 19G libres, 75% de uso
Images          42  36  44.47GB  7.331GB (16%)
Containers      89  22  1.375GB  1.08GB (78%)
Local Volumes   9   9   568.6MB  0B (0%)
Build Cache     14  14  1.192GB  0B
json.log más grandes: 99dad6c471ba 90 MB, 0ac64f2972d0 76 MB, 6d27983d7b70 66 MB, 88e317da4d2d 36 MB, 2da13770ad86 19 MB
umbral: uso menor a 80% y más de 15 GB libres (supuesto A9, Juan lo confirma en 57-05)
PASS dentro del umbral
```

A las 17:04 UTC, con el build ya cortado, el disco marcaba 77% de uso y 17 GB libres. Sigue dentro del umbral, pero a 2 GB del mínimo: un build completo de Next ocupa unos 2 a 3 GB de caché y de capas.

## Después del push

### Despliegues del preview (57-dokploy-status)

| Despliegue | Commit | Creado (UTC) | Estado |
|---|---|---|---|
| gxYVRunBDY49EjRtvAYQA | 1ef3cc4 fix(54): lista de Lexical en Que incluye | 16:38:55 | done |
| sWvjMlt4h-Q-fD6RdzQDP | 78d8c4e docs(54): verificación regenerada | 16:54:10 | cancelled |

El último despliegue por `createdAt` quedó en **cancelled**, así que `57-dokploy-status --app preview` sale con 1. La causa no es el disco:

1. El build de 78d8c4e llevó la carga del VPS a 29 (8 GB de RAM, sin swap).
2. A las 17:02:41 el agente de Docker Swarm reprogramó las tareas de **todos** los servicios del nodo (el log de `dockerd` registra intentos de pull fallidos para preview, dr-angulo, app-navigate, app-calculate y app-back-up a la vez) y mató el `npm run build` en el paso 9 de 11.
3. Dokploy y dokploy-postgres se reiniciaron. Al arrancar, Dokploy imprimió "Cancelled 2 deployments": así quedó cancelled el despliegue en curso.
4. El contenedor de producción `web` (app-program-online-alarm-1ewbq3) también se reinició a las 17:02:45 (la tarea anterior salió con código 1). juan-tech.com respondió 200 después del reinicio.

Antecedente que agrava el hallazgo: `dmesg` registra dos OOM kill de `next-server` el 2026-11-15 a las 17:05 y el 2026-11-17 a las 04:34. El del 17 mató el contenedor e69dc14e, que es la tarea anterior de producción `web` (salió con 137 hace 12 horas), justo durante el despliegue del preview de las 04:29. Un build del preview en este VPS ya tumbó producción al menos una vez y la reinició otra.

### Qué código sirve el preview

La imagen `juantech-preview-o247wi:latest` en uso (sha256:dc03142d...) se construyó a las 16:44:28, es decir, en el despliegue done de 1ef3cc4. Entre 1ef3cc4 y HEAD solo cambian archivos de `.planning` (`git diff --stat 1ef3cc4..HEAD -- src` vacío). El preview sirve el código final de la rama aunque el último registro de despliegue diga cancelled. El contenedor corre sano: `running`, sin salidas en los últimos 10 minutos.

### Comprobaciones vivas

- `53-wait-preview` (BASE_URL=https://dev.juan-tech.com): OK, 200 con `x-robots-tag noindex`
- `53-preview-contract`: todo en PASS (API cerrada en 404, `/preview-blocked` 404, noindex en `/` y `/en`, `/go/dinorank` redirige)

### Batería viva de la 56 (`56-run-all --live --no-wait`, arrancó a las 16:58 UTC)

27 pasos: 24 PASS y 3 FAIL. Los cuatro FAIL de despliegue que esperaba el handoff ya pasan: 56-no-marker-live (20 PASS), 56-cta-live (15 PASS), 56-legal-live (5 PASS) y 54-page-contract (61 PASS).

| Paso en FAIL | Detalle | Causa |
|---|---|---|
| 55-seo-parity | 128 PASS, 28 rutas de blog con 500 o 502 en el preview | Infraestructura: las peticiones cayeron durante el reinicio de Swarm de las 17:02. Repetición abajo |
| 55-content-parity | 6 posts EN: el preview enlaza `/services/...` y producción `/servicios/...` | No es siembra ni defecto: el preview corrige el prefijo de idioma del enlace EN. `/en/services/seo-consulting`, `/en/services/fullstack-development` y `/en/services/seo-technical-audit` responden 200 en los dos sitios. Lo decide 57-08 como diferencia aceptada |
| 54-about | `/en/sobre-mi` sin ninguna `img` con `alt` no vacío | Sin confirmar, tratar como posible defecto de contenido: la foto de Sobre mí tiene alt en ES y `alt=""` en EN. El cargador del corte (`28-phase56-cutover-load`, tarea `media-alt`) solo carga el alt de 6 capturas, así que puede no cubrir esta foto. 57-05 confirma si la carga lo resuelve; si no, falta el alt EN de la foto en Media |

### Repetición de 55-seo-parity con el preview estable (17:12 UTC)

152 PASS y 4 FAIL en 156 rutas. Los 28 errores 500 y 502 desaparecieron: eran del reinicio de Swarm. Los 4 FAIL restantes son `jsonld[0].dateModified` en `data-structures` y `dynamic-programming` (ES y EN):

- `data-structures`: preview 2026-11-15T04:04:04Z, producción 2026-11-17T17:12:25Z
- `dynamic-programming`: preview 2026-11-17T17:11:17Z, producción 2026-11-17T17:11:31Z

Causa: alguien o algo actualizó esos dos posts en la base compartida entre las 17:11 y las 17:12 UTC, y cada sitio tiene su propia caché de 60 s. No es defecto del preview. Este plan no escribió en la base; queda como observación para que Juan confirme si editó esos posts en el admin a esa hora.

### Resumen para 57-05 y 57-08

- Pendiente de despliegue: el último registro del preview dice cancelled. El código servido coincide con HEAD, pero `57-dokploy-status --app preview` no sale 0 hasta que un despliegue nuevo termine en done. Disparar ese despliegue implica otro build en el mismo VPS, que hoy ya reinició producción y el 17 a las 04:34 la tumbó por OOM. Lo decide Juan antes del próximo push.
- Riesgo para 57-11: el deploy de `web` en el corte compila en el mismo VPS de 8 GB sin swap. Con el patrón observado, ese build puede reiniciar o tumbar el `web` que está sirviendo y cancelar su propio despliegue.
- Siembra o contenido: alt EN de la foto de Sobre mí.
- Diferencia aceptable: enlaces EN a `/services/...` en 6 posts.
