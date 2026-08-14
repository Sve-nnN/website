#!/usr/bin/env bash
# Driver del ciclo de trabajo de la auditoria SEO 2026-08.
#
#   ./scripts/seo/issue.sh prompt 2   # imprime el prompt de /gsd:quick listo para pegar
#   ./scripts/seo/issue.sh start 2    # crea la rama seo/02-... desde master
#   ./scripts/seo/issue.sh pr 2       # abre el PR contra master
#   ./scripts/seo/issue.sh close 2    # valida contra el sitio live, etiqueta y cierra
#   ./scripts/seo/issue.sh status     # tabla de todos los issues
#
# El ciclo completo por issue:
#   1. issue.sh start N
#   2. pegar en Claude Code lo que imprime issue.sh prompt N
#   3. issue.sh pr N  -> revisar CI -> mergear
#   4. ESPERAR el deploy de Dokploy
#   5. issue.sh close N
#
# close() se niega a cerrar si la validacion falla. Esa es la idea.

set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT" || exit 1

VALIDATE="$REPO_ROOT/scripts/seo/validate.sh"

# Los issues que necesitan el flujo completo de GSD en vez de quick, y por que.
needs_full() {
  case "$1" in
    5)  echo "consolidar contenido es irreversible (301 + borrado). Necesita research sobre datos de GSC antes de decidir que URL gana." ;;
    6)  echo "toca configuracion de fuentes, middleware de locale y next.config a la vez. Necesita research y verificacion." ;;
    *)  echo "" ;;
  esac
}

slug_of() {
  case "$1" in
    1)  echo "01-placeholders-landings" ;;
    2)  echo "02-hreflang-servicios" ;;
    3)  echo "03-identidad-eeat" ;;
    4)  echo "04-404-indexado" ;;
    5)  echo "05-canibalizacion" ;;
    6)  echo "06-performance-lcp" ;;
    7)  echo "07-traducciones-en" ;;
    8)  echo "08-meta-descriptions" ;;
    9)  echo "09-structured-data" ;;
    10) echo "10-accesibilidad" ;;
    11) echo "11-higiene-tecnica" ;;
    *)  echo "" ;;
  esac
}

require_issue() {
  [ -n "${1:-}" ] || { echo "Falta el numero de issue." >&2; exit 2; }
  [ -n "$(slug_of "$1")" ] || { echo "Issue $1 no es parte de la auditoria (validos: 1-11)." >&2; exit 2; }
}

cmd_prompt() {
  require_issue "${1:-}"
  local n="$1" full
  full="$(needs_full "$n")"

  echo "───────────────────────────────────────────────────────────────"
  if [ -n "$full" ]; then
    echo "/gsd:quick --full Resolver el issue #$n de github.com/Sve-nnN/website."
  else
    echo "/gsd:quick Resolver el issue #$n de github.com/Sve-nnN/website."
  fi
  cat <<PROMPT

Lee el issue completo primero con: gh issue view $n

El issue trae el problema medido, la causa raiz ya diagnosticada, el criterio
de aceptacion y el bloque de comandos de validacion con su baseline. Respetalos:
no re-diagnostiques lo que ya esta medido, y no amplies el alcance mas alla del
criterio de aceptacion.

Reglas de este trabajo:
- Ya estas en la rama seo/$(slug_of "$n"). No cambies de rama.
- No inventes datos, cifras ni testimonios. Si falta un dato real, decilo y
  proponer quitar el bloque antes que rellenarlo.
- Si el fix necesita migracion de base de datos: es Neon de produccion, no hay
  entorno de staging. Las migraciones aditivas corren solas; cualquier cosa
  destructiva (DROP, TRUNCATE, delete, reshape de campo con datos) para y pide
  aprobacion nominal de Juan.
- Al terminar NO cierres el issue. El cierre pasa despues del deploy, con
  ./scripts/seo/issue.sh close $n

Verificacion local antes de dar por hecho el trabajo:
  npx tsc --noEmit
PROMPT

  if [ -n "$full" ]; then
    echo
    echo "Nota: este issue va con --full a proposito. Razon: $full"
  fi
  echo "───────────────────────────────────────────────────────────────"
}

cmd_start() {
  require_issue "${1:-}"
  local n="$1" branch
  branch="seo/$(slug_of "$n")"

  if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
    echo "Hay cambios sin commitear. Resolvelos antes de arrancar otro issue." >&2
    git status --short >&2
    exit 1
  fi

  git fetch origin master --quiet 2>/dev/null || true
  if git show-ref --verify --quiet "refs/heads/$branch"; then
    echo "La rama $branch ya existe. Cambiando a ella."
    git checkout "$branch"
  else
    git checkout -b "$branch" origin/master 2>/dev/null || git checkout -b "$branch" master
  fi

  echo
  echo "Rama lista: $branch"
  echo
  gh issue view "$n" --json title,labels \
    --jq '"  #'"$n"'  \(.title)\n  labels: \(.labels|map(.name)|join(", "))"' 2>/dev/null
  echo
  echo "Ahora pega esto en Claude Code:"
  echo
  cmd_prompt "$n"
}

cmd_pr() {
  require_issue "${1:-}"
  local n="$1" branch title
  branch="seo/$(slug_of "$n")"
  title="$(gh issue view "$n" --json title --jq .title)"

  git push -u origin "$branch"
  gh pr create --base master --head "$branch" \
    --title "$title" \
    --body "Cierra parcialmente #$n.

El issue se cierra recien despues del deploy, cuando pase la validacion contra
el sitio live:

\`\`\`
./scripts/seo/issue.sh close $n
\`\`\`

Ver #12 para el baseline y el flujo completo."
}

cmd_close() {
  require_issue "${1:-}"
  local n="$1" out rc

  echo "Validando el issue #$n contra el sitio live..."
  echo "(si acabas de mergear, asegurate de que Dokploy ya termino el deploy)"
  echo

  out="$("$VALIDATE" "$n" 2>&1)"
  rc=$?
  echo "$out"

  if [ $rc -ne 0 ]; then
    echo
    echo "La validacion fallo. El issue queda abierto."
    gh issue edit "$n" --add-label "needs-validation" >/dev/null 2>&1
    gh issue comment "$n" --body "Validacion post-deploy FALLIDA el $(date '+%Y-%m-%d %H:%M').

\`\`\`
$(echo "$out" | sed 's/\x1b\[[0-9;]*m//g')
\`\`\`"
    exit 1
  fi

  gh issue edit "$n" --add-label "validated" --remove-label "needs-validation" >/dev/null 2>&1
  gh issue comment "$n" --body "Validado contra https://juan-tech.com el $(date '+%Y-%m-%d %H:%M').

\`\`\`
$(echo "$out" | sed 's/\x1b\[[0-9;]*m//g')
\`\`\`"
  gh issue close "$n"
  echo
  echo "Issue #$n cerrado con la evidencia pegada."
}

cmd_status() {
  printf '%-4s %-11s %-58s %s\n' '#' 'ESTADO' 'TITULO' 'RAMA'
  for n in 1 2 3 4 5 6 7 8 9 10 11; do
    local st title branch mark
    st=$(gh issue view "$n" --json state --jq .state 2>/dev/null || echo "?")
    title=$(gh issue view "$n" --json title --jq .title 2>/dev/null | cut -c1-56)
    branch="seo/$(slug_of "$n")"
    if git show-ref --verify --quiet "refs/heads/$branch"; then mark="si"; else mark="-"; fi
    printf '%-4s %-11s %-58s %s\n' "$n" "$st" "$title" "$mark"
  done
  echo
  echo "Baseline y flujo completo: gh issue view 12"
}

case "${1:-}" in
  prompt) shift; cmd_prompt "$@" ;;
  start)  shift; cmd_start "$@" ;;
  pr)     shift; cmd_pr "$@" ;;
  close)  shift; cmd_close "$@" ;;
  status) cmd_status ;;
  *)      sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit 2 ;;
esac
