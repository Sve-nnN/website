# Phase 3: Cloudinary Media Spike - Context

**Gathered:** 2026-07-09
**Status:** Ready for planning

<domain>
## Phase Boundary

El único riesgo arquitectónico abierto del proyecto (no existe adapter oficial de Payload para Cloudinary) queda resuelto con un adapter validado contra una cuenta real de Cloudinary, gateado por env vars. Entrega: adapter de storage funcionando (upload/delete/URL generation), registrado condicionalmente en `payload.config.ts` solo cuando hay credenciales, fallback a disco local sin credenciales, transformaciones `f_auto,q_auto` compatibles con `next/image`. No incluye: re-subida de medios reales (eso es Fase 4, cuando se migra contenido real desde Mongo).

</domain>

<decisions>
## Estrategia de adapter (ya resuelta por research — PLUGINS.md actualizado tras hallazgo de Juan)

- **Primera opción**: adapter custom sobre `@payloadcms/plugin-cloud-storage` (framework oficial), portado de la referencia validada `github.com/Sahitya1707/payload-cloudinary` (target original Payload 3.33, verificar compatibilidad con 3.85 en este spike)
- **Fallback si el custom encuentra un bloqueo real**: `@jhb.software/payload-cloudinary-plugin` (team-backed, pin más ajustado a Payload actual) o `payload-storage-cloudinary` (nlvcodes)
- **Descartado explícitamente**: `payload-cloudinary` (SyedMuzamilM) — red flag de metadata de dependencias inconsistente

## Funciones del adapter (interfaz `GeneratedAdapter` de Payload)

- `handleUpload` — sube a Cloudinary vía `cloudinary.uploader.upload_stream` (Promise-wrapped, el SDK es callback-based)
- `handleDelete` — borra el asset de Cloudinary por public ID
- `generateURL` / `generateFileURL` — construye la URL pública de Cloudinary para que `next/image` la use directo (no proxeada por el server Node)
- `staticHandler` — puede devolver 501 "Not implemented" (Cloudinary sirve URLs públicas directo, no hace falta servir desde el server)

## Configuración (ya en `.env`, no hace falta pedirle nada nuevo a Juan)

- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` ya están cargados en `.env` desde el arranque del proyecto (copiados de JuanPortfolio)
- `disableLocalStorage: true` cuando las credenciales están presentes; gateo condicional para que sin credenciales caiga a disco local (dev sin Cloudinary configurado sigue funcionando)

### Claude's Discretion

- Estructura exacta del prefijo/folder en Cloudinary (la referencia usa `media/`, mantener ese patrón salvo razón en contra)
- Nombre exacto del archivo del adapter (`src/lib/cloudinary-adapter.ts` o similar)
- Cómo se estructura el spike de comparación entre el adapter custom y los fallbacks si el custom falla

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets

- `github.com/Sahitya1707/payload-cloudinary` (repo público, verificado vía GitHub API: target `payload@3.33.0`, `@payloadcms/plugin-cloud-storage@^3.36.1`, `cloudinary@^2.6.0`, actualizado abril 2026) — plantilla de partida
- `/Users/juan/Documents/Codigo/Personal/juantech/juan-payload/src/collections/Media/index.ts` (Fase 1 — colección Media ya existe, actualmente en disco local)
- Patrón de referencia oficial: `@payloadcms/storage-s3` o `@payloadcms/storage-r2` (thin wrappers sobre `@payloadcms/plugin-cloud-storage`'s `GeneratedAdapter` shape) — el más cercano arquitectónicamente

### Established Patterns

- Registro condicional de plugin por env vars — mismo patrón que ya usa `payload.config.ts` para otras piezas gateadas

### Integration Points

- `payload.config.ts` — el plugin se registra en el array `plugins`, target la colección `media`
- `next.config.mjs` — necesita `images.remotePatterns` apuntando al hostname de Cloudinary (`res.cloudinary.com`) para que `next/image` optimice correctamente

</code_context>

<specifics>
## Specific Ideas

- Juan mismo encontró y validó la referencia de GitHub que cambió la recomendación de "probar paquetes de comunidad primero" a "adapter custom primero" — ver research/PLUGINS.md actualizado

</specifics>

<deferred>
## Deferred Ideas

- Re-subida real de medios existentes (JuanPortfolio → Cloudinary) — eso es Fase 4 (MIGR-05)

</deferred>
