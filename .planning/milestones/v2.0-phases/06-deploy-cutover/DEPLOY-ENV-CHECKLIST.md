# Deploy Env Checklist — Hostinger Production Server

Lista de las variables de entorno reales que deben existir en el servidor Hostinger para que el proceso standalone (`ecosystem.config.cjs`) arranque correctamente. **Solo las keys — nunca pegar valores reales aquí ni en el chat.**

## Keys requeridas (extraídas de `.env` local real)

| Key | Provisto por |
|-----|--------------|
| `DATABASE_URI` | Neon (connection string) |
| `PAYLOAD_SECRET` | Generado, secreto de la app |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary |
| `CLOUDINARY_API_KEY` | Cloudinary |
| `CLOUDINARY_API_SECRET` | Cloudinary |
| `CONTACT_TO_EMAIL` | Config del formulario de contacto |
| `RESEND_API_KEY` | Resend |
| `RESEND_FROM_EMAIL` | Resend (dominio verificado) |
| `NEXT_PUBLIC_SERVER_URL` | **Debe apuntar al dominio de producción real** (ej. `https://juan-tech.com`), NUNCA `localhost` |

Además, `PORT`, `HOSTNAME`, y `NODE_ENV` ya quedan fijadas por `ecosystem.config.cjs` (`env: { NODE_ENV: 'production', PORT: 3000, HOSTNAME: '0.0.0.0' }`) — no hace falta duplicarlas en el `.env` del servidor, aunque no es un problema si están presentes en ambos lugares (PM2 las sobreescribe).

> Nota (Plan 06-02): si tras confirmar el límite de conexiones de Neon se decide separar la connection string pooled de la unpooled, se añadirá una key adicional `DATABASE_URI_MIGRATE` — ver `.planning/phases/06-deploy-cutover/NEON-POOL-SIZING.md` para el estado final de esa decisión y actualizar esta tabla si aplica.

## Dónde setearlas en Hostinger

Dos formas válidas — usar la que ofrezca el tier real de Juan (confirmar en el runbook de la Task 3 de este plan):

**Opción A — archivo `.env` en la raíz del repo en el servidor**
- Crear `~/ruta-del-repo/.env` con los valores reales.
- `chmod 600 .env` (solo el usuario dueño del proceso puede leerlo).
- Ya está gitignorado (`.env` en `.gitignore`) — nunca debe terminar en un commit.
- Next/Payload lo lee automáticamente en runtime vía `node --env-file=.env` o el loader nativo de Node.

**Opción B — variables de entorno del panel de Hostinger**
- hPanel → Node.js app → Environment Variables (si el tier de Juan expone esta UI para apps Node gestionadas).
- A confirmar en el runbook: si Hostinger no ofrece este panel para el tier contratado, usar solo la Opción A.

## Advertencias

- Nunca commitear valores reales de estas keys, en ningún archivo del repo.
- Nunca pegar valores reales en el chat con Claude — Claude no necesita verlos, solo confirmar que las keys existen (ej. pegando el output de `env | grep -oE '^[A-Z_]+='` que solo muestra los nombres, no los valores).
- Si algún valor se filtra accidentalmente (commit, chat, log), rotarlo de inmediato (regenerar `PAYLOAD_SECRET`, rotar la API key de Cloudinary/Resend, resetear el password de Neon).
