# Content Freeze Runbook

DEPLOY-05 aplica al backend Postgres/Payload nuevo como fuente de verdad actual (el contenido ya fue migrado en Phase 4) — el objetivo es demostrar con evidencia verificable, no solo con la palabra de Juan, que nada se publicó ni editó entre el freeze y el go-live.

Procedimiento a ejecutar cronológicamente, en orden, antes del corte de DNS (Plan 06-03):

## Pasos

1. **Declarar el freeze:** a partir de este momento, no publiques ni edites contenido en el admin de Payload (`/admin`) hasta que el go-live (Plan 06-04) esté confirmado.

2. **Tomar el snapshot inicial:**
   ```bash
   node --env-file=.env node_modules/.bin/tsx scripts/content-freeze-snapshot.ts --tag freeze
   ```
   Confirmar que el JSON generado tiene los conteos que esperas para cada colección (posts, case-studies, authors, etc.). El path exacto se imprime al final de la corrida.

3. **Proceder con el resto de la fase:** Plan 06-03 (DNS cutover), Plan 06-04 (go-live checklist).

4. **Inmediatamente antes de confirmar el go-live final**, tomar el segundo snapshot:
   ```bash
   node --env-file=.env node_modules/.bin/tsx scripts/content-freeze-snapshot.ts --tag pre-golive
   ```

5. **Diffear los dos snapshots:**
   ```bash
   node --env-file=.env node_modules/.bin/tsx scripts/verify-content-freeze.ts \
     --before <path del snapshot freeze> \
     --after <path del snapshot pre-golive>
   ```
   Pegar el output completo.

6. **Interpretar el resultado:**
   - Si el output dice `NO DRIFT — freeze held`: el freeze se sostuvo, proceder con confianza al go-live.
   - Si reporta drift (ids agregados, editados, o removidos): detener el go-live e investigar qué se publicó/editó antes de continuar.

## Nota sobre los snapshots

Los archivos JSON de snapshot se guardan en `.planning/phases/06-deploy-cutover/freeze-snapshots/` (gitignorado — son dumps de datos reales de producción, regenerables, no código fuente). Guarda los paths exactos que imprime cada corrida, los necesitarás para el paso 5.
