---
status: complete
phase: 53-base-del-redise-o-rama-preview-tema-y-shell
source: [53-VERIFICATION.md]
started: 2026-11-08T01:50:00Z
updated: 2026-11-08T01:50:00Z
---

## Current Test

number: 1
name: Revalidación del nav entre admin real y preview
expected: |
  Cambias una etiqueta del global Header en https://juan-tech.com/admin, guardas, y a los 60 a 120 s https://dev.juan-tech.com muestra el cambio sin redeploy. Devuelves la etiqueta original.
awaiting: user response

## Tests

### 1. Revalidación del nav entre admin real y preview
expected: el cambio aparece en el preview en 60 a 120 s sin redeploy
result: skipped (Juan renunció a la revisión manual el 2026-11-08)

### 2. Lectores de pantalla (NVDA con Firefox, VoiceOver con Safari)
expected: selector de idioma, Drawer y toggle de movimiento se anuncian una vez, sin foco perdido
result: skipped (Juan renunció a la revisión manual el 2026-11-08)

### 3. Revisión visual del preview a 900, 1024 y 1280 px
expected: nav con 6 enlaces sin desborde, contraste del texto secundario mínimo 4.5:1, fiel al sandbox
result: skipped (Juan renunció a la revisión manual el 2026-11-08)

### 4. Foco visible con Tab
expected: enlace de salto visible y foco no tapado por el header ni el toggle fijos (SC 2.4.11)
result: skipped (Juan renunció a la revisión manual el 2026-11-08)

### 5. Admin local sin fuga de MUI
expected: /admin/login se ve igual que producción y el HTML no trae data-emotion ni variables --jt-
result: skipped (Juan renunció a la revisión manual el 2026-11-08)

## Summary

total: 5
passed: 0
issues: 0
pending: 0
skipped: 5
blocked: 0

## Gaps
