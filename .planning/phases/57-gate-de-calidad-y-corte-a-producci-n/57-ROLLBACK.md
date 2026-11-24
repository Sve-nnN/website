# Rollback del corte a producción (fase 57, D-14)

Juan, este documento explica cómo volver atrás si el corte sale mal. El código se revierte con git y un redespliegue. Los datos no necesitan regreso por las migraciones, pero el cargador de contenido sí cambia datos, y para eso hay tres caminos al final. El rollback nunca se ejecuta sin tu decisión: Claude presenta la causa y las condiciones, y tú decides.

## 1. Cuándo se dispara el rollback

Cualquiera de estas condiciones, medida después del deploy y con el TTL de 60 s vencido:

1. La home o las páginas de servicios responden 5xx durante más de 5 minutos.
2. El sitemap o los redirects son distintos del snapshot previo al corte y pierden URLs.
3. El formulario de contacto no entrega el correo de prueba y no se arregla en 30 minutos.
4. El contenido de Payload muestra marcadores pendientes a los visitantes (textos del tipo "pendiente" o "propuesto").
5. El disco del VPS llega a 100%: `shared-postgres` entra en recuperación y Dokploy cancela despliegues sin avisar.

Los umbrales del monitoreo de los 28 días siguientes están en `57-MONITOREO.md` y dicen cuáles corrigen hacia adelante y cuáles revierten.

## 2. Orden del código

Requisito del merge: el corte se hace con un merge commit, nunca con squash ni con rebase. Sin merge commit no existe el padre 1 y `git revert -m 1` no se puede usar. El ensayo de abajo parte de ese supuesto.

1. Disco primero: `node scripts/verify/57-vps-disk-check.mjs`. Si no cumple el umbral (menos de 80% de uso y más de 15 GB libres), Juan decide la limpieza antes de redesplegar.
2. En `master`, localiza el commit de merge y revierte el padre 1:

   ```
   git checkout master
   git pull
   git log --merges -1 --format=%H
   git revert -m 1 <hash del merge>
   ```

   Confirma que el resultado coincide con el árbol anterior al merge: `git diff <commit de master antes del merge> HEAD` debe salir vacío.
3. Empuja `master`. El repositorio despliega al mergear a `master`, así que Dokploy compila el commit del revert. Empujar es una acción tuya o con tu autorización escrita.
4. Alternativa si Dokploy no despliega solo: restablecer `master` al commit anterior al merge con tu autorización y llamar `application.deploy` sobre la app `web`. Esta ruta reescribe historia compartida, así que solo se usa si la anterior falla.
5. Espera con `node scripts/verify/57-dokploy-status.mjs --app web --wait 1500`. El estado `done` no basta: el script comprueba también el contenedor y cualquier despliegue `cancelled`.

Rollback por imagen de Dokploy (supuesto A8 verificado en el código fuente): el router `rollbacks` de Dokploy existe (consultado con `gh api repos/Dokploy/dokploy/contents/apps/dokploy/server/api/routers/rollbacks.ts`) y expone `rollback` y `delete` sobre un `rollbackId`. Depende del campo `rollbackActive` de cada app, que por defecto es `false`. Lectura de solo lectura del 2026-11-24: en la app `web` y en el preview, `rollbackActive` es `false` y no hay registro de rollback definido. Entonces Dokploy no guardó imágenes anteriores de `web`, y el rollback por imagen no sirve como vía de regreso para este corte. Si quieres esa opción para el futuro, hay que activarla en la app antes de un deploy; se anota como mejora, no como camino de esta fase.

Para volver a aplicar el rediseño después de un rollback: el revert queda en la historia, así que un nuevo merge de la misma rama no trae los cambios revertidos. Hay que revertir el revert (`git revert <hash del revert>`) y luego mergear.

## 3. Ensayo del revert

Ensayo hecho el 2026-11-24 en un worktree temporal fuera del repo, sin tocar la rama de trabajo, sin push y sin base de datos.

| Paso | Resultado |
|---|---|
| Base | `master` en `e38cdf4`. `feat/mui-redesign` en `7cc3148`, 282 commits por delante y 0 por detrás |
| Worktree y rama temporales | Creados en el scratchpad de la sesión desde `master` |
| `git merge --no-ff feat/mui-redesign` | Sin conflictos. Commit de merge `a36c202` con dos padres. 582 archivos distintos de `master` |
| `git revert -m 1` del commit de merge | Sin conflictos. Commit de revert `167fa69` |
| `git diff master` contra el resultado | Vacío: 0 archivos. El árbol vuelve exactamente al de `master` |
| Limpieza | Worktree y rama temporal eliminados. `git worktree list` no muestra ninguno del ensayo |

Tiempos del ensayo local: cada paso de git tardó 1 s o menos. En el corte real el tiempo lo manda el build de Dokploy, que no se midió en este ensayo; el plazo de espera que usaron los planes 57-06 y 57-07 fue de 1500 s, así que conviene contar entre 10 y 25 minutos desde el push del revert hasta un contenedor sano. Ensayo pendiente, opcional y sin riesgo: repetir el revert en la rama del preview y medir cuánto tarda el redespliegue del preview.

## 4. Datos

1. Las migraciones de las fases 54 a 56 son aditivas (tablas y columnas nuevas, sin borrar nada): no necesitan regreso. El código anterior las ignora.
2. El cargador de contenido (`--apply`) no tiene modo de restauración. Escribe valores que `master` sí lee. Hay tres caminos, del más cómodo al más pesado (de `56-CUTOVER-HANDOFF.md`):
   1. Versiones de Payload en `websites` y `case-studies`: en la pestaña Versions del admin se restaura la versión anterior. Deshace filas de Websites y lecciones de casos.
   2. `media`, `authors`, `testimonials`, `header` y `legal-pages` no tienen versiones. Se reescribe a mano el valor del JSON de respaldo que el cargador guarda fuera del repo antes de escribir, o se repite el cargador con los datos viejos.
   3. Restaurar el volcado verificado de la base `juantech` (ver el punto 5).
3. Aviso de tiempo: las escrituras por script no invalidan el tag de `unstable_cache`. Un cambio o su reversión sale tras el TTL de 60 s. Un cambio que no se ve al instante no significa que falló.
4. El texto sombra (globals `home-page`, `about-page` y `legal-pages`) se rehace con `26-phase56-seed-shadow.ts` y `27-phase56-seed-legal.ts`, ambos con dry-run por defecto. `master` no los lee.
5. Cualquier restauración de datos que borre o reemplace filas necesita tu aprobación escrita por nombre antes de correr. Claude no ejecuta escrituras destructivas por su cuenta.

## 5. Requisito previo: volcado de respaldo verificado

Antes del `--apply` del cargador, en el plan 57-10, tú corres un volcado completo de la base de producción y lo verificas:

```
pg_dump -Fc -f <archivo fuera del repo, con la fecha en el nombre> <base juantech>
pg_restore --list <archivo> | head
```

El volcado es válido solo si `pg_restore --list` imprime el índice de objetos sin error y el archivo pesa algo coherente con la base. Se guarda fuera del repo y sin credenciales a la vista (D-10). El acceso a la base de producción sigue el procedimiento acordado en 57-10 (túnel por SSH); Claude no abre ese acceso por su cuenta. Los respaldos nativos de Dokploy pueden no cubrir `shared-postgres` porque se despliega como Compose (supuesto A7), así que este volcado es el único respaldo que cuenta.

## 6. Cómo verificar el regreso

Con el TTL de 60 s vencido, contra producción, solo lectura:

```
PROD_BASE=https://juan-tech.com node scripts/verify/57-seo-parity-all.mjs --live-prod --vs-snapshot .planning/phases/57-gate-de-calidad-y-corte-a-producci-n/evidence/57-prod-snapshot-pre.json --skip-new-routes
```

`--skip-new-routes` omite el contrato de las rutas nuevas, que vuelven a dar 404 tras el rollback. El regreso es correcto cuando el script sale 0: mismos estados, mismos campos de head, mismo sitemap, mismo `robots.txt` y mismos redirects que el snapshot previo al corte. Después, `BASE_URL=https://juan-tech.com node scripts/verify/56-run-all.mjs --live --no-wait` confirma las páginas del sitio anterior.

## 7. Resumen de tiempos esperados

| Etapa | Tiempo esperado |
|---|---|
| Decidir y crear el revert en git | Menos de 1 minuto de git, más el tiempo de decisión |
| Build y despliegue en Dokploy | De 10 a 25 minutos (plazo usado en la fase: 1500 s) |
| Caché de datos tras restaurar contenido | 60 s de TTL |
| Verificación contra el snapshot | De 5 a 15 minutos |
