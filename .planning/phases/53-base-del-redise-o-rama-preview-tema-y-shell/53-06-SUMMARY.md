---
phase: 53-base-del-redise-o-rama-preview-tema-y-shell
plan: 06
subsystem: infra
tags: [dokploy, preview, postgres, readonly, nixpacks, cloudflare, noindex]

requires:
  - phase: 53-02
    provides: compuertas de solo lectura, noindex y robots cerrado
  - phase: 53-05
    provides: shell MUI ensamblado y scripts de navegador
provides:
  - Preview https://dev.juan-tech.com desplegado desde feat/mui-redesign
  - Rol Postgres juantech_preview_ro (solo SELECT, sin tablas sensibles)
  - scripts/verify/53-wait-preview.mjs y 53-crawl-parity.mjs
affects: [54, 55, 56, 57]

actuals:
  tasks: 4
  commits: 3

key-files:
  created:
    - scripts/verify/53-wait-preview.mjs
    - scripts/verify/53-crawl-parity.mjs
  modified:
    - package-lock.json

key-decisions:
  - "Juan autorizó explícitamente a Claude para usar SSH, el token de Dokploy y el MCP de Cloudflare; Claude creó el rol, el DNS y la app en lugar de dejarlos como pasos manuales"
  - "El lockfile se regeneró con npm 10.9.2 (el de Nixpacks con Node 22) porque npm 11 dejaba fuera @swc/helpers@0.5.24 y yaml@2.9.1"
---

# Fase 53 Plan 06: Preview seguro en dev.juan-tech.com

El preview sirve `feat/mui-redesign` con noindex, robots cerrado, sin sitemap y con admin y api en 404. Lee la base de producción con un rol de solo lectura.

## Datos no secretos

- Aplicación Dokploy `juantech-preview`, id `vc40Q8JVHecr2ZNFz5IEa`, mismo environment y build `nixpacks` que producción.
- Dominio `dev.juan-tech.com` (registro A hacia el VPS, solo DNS, certificado letsencrypt), puerto 3000.
- Variables del Environment: `PREVIEW_READONLY`, `NEXT_PUBLIC_SERVER_URL`, `DATABASE_URI`, `PAYLOAD_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Sin `RESEND_API_KEY` ni `CONTACT_TO_EMAIL`.
- SHA desplegado: `150fb3f` (fix del lockfile sobre `21e00e2`). `master` sigue en `6e9b02a`.
- Disco del VPS: 54% antes del build, 60% después.

## Resultados

| Comprobación | Resultado |
|--------------|-----------|
| Rol: `SELECT count(*) FROM pages` | 13 |
| Rol: `INSERT` | `cannot execute INSERT in a read-only transaction` |
| Rol: `SELECT` sobre `users` | `permission denied for table users` |
| 53-wait-preview | OK |
| 53-preview-contract | PASS |
| 53-shell-contract (EXPECT_PREVIEW=1) | PASS |
| 53-computed-styles (REQUIRE_BUTTON=1) | PASS (una corrida dio código 1 sin reproducirse; las dos siguientes dieron 0) |
| 53-crawl-parity | 169 URLs, 0 diferencias |
| `permission denied` en logs del preview | 0 |

## Desviaciones

1. **Build fallido por lockfile.** El primer despliegue falló en `npm ci` (`Missing: @swc/helpers@0.5.24 from lock file`, `yaml@2.9.1`). Se regeneró `package-lock.json` con `npm@10.9.2`, `npm ci --dry-run` pasa con npm 10.9.2 y 11, y el segundo despliegue terminó en `done`.
2. **DNS local con caché negativa.** El Mac de Juan no resolvía `dev.juan-tech.com` justo después de crearlo. Los scripts se corrieron con un preload de Node en el scratchpad que fija esa resolución; el sitio resuelve bien desde fuera (`dig` devuelve la IP).
3. **Pasos manuales automatizados.** Rol, DNS y app se hicieron desde la sesión con la autorización explícita de Juan.

## Pendiente para el UAT (human-check)

1. Revalidación: cambiar una etiqueta en el global Header del admin real y ver el cambio en el preview en 2 minutos, sin redeploy (D-12).
2. NVDA con Firefox y VoiceOver con Safari sobre el selector de idioma y el Drawer.
3. Revisión visual del pill de nav a 900, 1024 y 1280 px, contraste del texto secundario y foco visible con Tab.
4. Admin local: confirmar que `/admin/login` se ve igual y no trae `data-emotion` ni variables `--jt-`.

## Seguridad

Los secretos viven solo en `~/.config/juantech/*.env` (chmod 600) y en el Environment de Dokploy. Ningún comando de este plan imprimió valores.
