#!/usr/bin/env bash
# Validador de la auditoria SEO 2026-08 contra el sitio EN VIVO.
#
# Uso:
#   ./scripts/seo/validate.sh 2        # valida solo el issue #2
#   ./scripts/seo/validate.sh 1 2 4    # valida varios
#   ./scripts/seo/validate.sh all      # valida todos
#
# Variables:
#   SITE=https://juan-tech.com   (default; overrideable para probar otro entorno)
#
# Exit 0 si todo pasa, 1 si algo falla. Cada check imprime PASS/FAIL con el
# valor medido y el esperado, para que la salida sirva como evidencia de cierre.
#
# IMPORTANTE: esto se corre DESPUES del deploy. Dokploy despliega al mergear a
# master. Validar antes del deploy da falsos negativos.
#
# Baseline 2026-08-14 documentado en el issue #12 del repo.

set -uo pipefail

SITE="${SITE:-https://juan-tech.com}"
FAILED=0
CHECKS=0

# ── helpers ──────────────────────────────────────────────────────────────────

c_pass() { printf '  \033[32mPASS\033[0m  %s\n' "$1"; }
c_fail() { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; FAILED=1; }
c_info() { printf '  ----  %s\n' "$1"; }

hdr() { printf '\n\033[1m=== SEO-%02d: %s ===\033[0m\n' "$1" "$2"; }

# check <descripcion> <valor_medido> <valor_esperado>
check() {
  CHECKS=$((CHECKS + 1))
  if [ "$2" = "$3" ]; then
    c_pass "$1 (= $3)"
  else
    c_fail "$1 (medido: $2, esperado: $3)"
  fi
}

# check_num <descripcion> <medido> <op> <umbral>   op: lt gt le ge
check_num() {
  CHECKS=$((CHECKS + 1))
  local desc="$1" got="$2" op="$3" want="$4" ok=1
  case "$op" in
    lt) [ "$(echo "$got < $want" | bc -l)" = "1" ] && ok=0 ;;
    le) [ "$(echo "$got <= $want" | bc -l)" = "1" ] && ok=0 ;;
    gt) [ "$(echo "$got > $want" | bc -l)" = "1" ] && ok=0 ;;
    ge) [ "$(echo "$got >= $want" | bc -l)" = "1" ] && ok=0 ;;
  esac
  if [ $ok -eq 0 ]; then c_pass "$desc (= $got, $op $want)"
  else c_fail "$desc (medido: $got, esperado $op $want)"; fi
}

# count <patron_grep_extendido> — cuenta OCURRENCIAS, no lineas.
# `grep -c` cuenta lineas coincidentes, que no es lo mismo: una linea con 14
# placeholders cuenta 1. El HTML de Next viene practicamente en una sola linea,
# asi que la diferencia importa.
count() { grep -oiE "$1" | wc -l | tr -d ' '; }

# cache-buster para evitar leer una respuesta cacheada por un intermediario
fetch() { curl -sS --max-time 30 "${SITE}${1}?cb=${RANDOM}${RANDOM}"; }
status() { curl -sS -o /dev/null -w '%{http_code}' --max-time 30 "${SITE}${1}"; }
redirect() { curl -sS -o /dev/null -w '%{redirect_url}' --max-time 30 "${SITE}${1}"; }
headers() { curl -sSI --max-time 30 "${SITE}${1}"; }

hreflang_of() { headers "$1" | grep -i '^link:' | tr ',' '\n' | grep -i 'hreflang'; }

# has <texto> <patron>  — subcadena literal, SIN pipe.
#
# `echo "$html" | grep -q 'x'` es una trampa con `set -o pipefail`: grep -q sale
# al primer match, echo se queda escribiendo en un pipe cerrado, recibe EPIPE, y
# el pipeline devuelve el status de echo. O sea que un patron que aparece TEMPRANO
# en un HTML de 500 KB da FAIL y el mismo patron al final da PASS. Costo un rato
# de diagnostico falso en el issue #9 el 2026-08-20: "el Article no incluye
# image" cuando la image estaba ahi. La comparacion de patron de bash no abre
# ningun pipe.
has() { case "$1" in *"$2"*) return 0 ;; *) return 1 ;; esac; }

# has_i <texto> <patron>  — igual que has(), sin distinguir mayusculas.
has_i() {
  # ${var,,} necesita bash 4; macOS trae bash 3.2, asi que se baja con tr.
  local hay needle
  hay=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')
  needle=$(printf '%s' "$2" | tr '[:upper:]' '[:lower:]')
  case "$hay" in *"$needle"*) return 0 ;; *) return 1 ;; esac
}

# ── SEO-01: placeholders en landings locales ─────────────────────────────────
v01() {
  hdr 1 "Texto [PLACEHOLDER] en las 4 landings locales"
  c_info "baseline 2026-08-14: 14 / 14 / 10 / 10"
  for u in /seo-tecnico-madrid /en/seo-tecnico-madrid /seo-tecnico-lima /en/seo-tecnico-lima; do
    n=$(fetch "$u" | count 'PLACEHOLDER')
    check "sin placeholders en $u" "$n" "0"
  done
}

# ── SEO-02: hreflang de servicios ────────────────────────────────────────────
v02() {
  hdr 2 "Hreflang: el <head> manda, el header HTTP no contradice"
  c_info "CORREGIDO 2026-08-14: el <head> SIEMPRE estuvo bien. Next emite hrefLang"
  c_info "en camelCase y el grep original lo buscaba en minuscula, de ahi el falso"
  c_info "diagnostico. El unico defecto real era el header Link de next-intl."

  # 1. el <head> es la anotacion primaria y debe estar completa en toda plantilla
  for u in / /servicios /servicios/seo-consulting /en/services /blog \
           /blog/tech-seo/nextjs-seo /case-studies/immigration-law-atlanta-seo \
           /seo-tecnico-madrid /websites /authors/juan-carlos-angulo; do
    n=$(fetch "$u" | count '<link rel="alternate" hreflang=')
    check "3 alternates en el <head> de $u" "$n" "3"
  done

  # 2. el <head> de servicios apunta al slug traducido, no al prefijado
  h=$(fetch /servicios | grep -oiE '<link rel="alternate"[^>]*>')
  if has "$h" 'juan-tech.com/en/services"'; then
    c_pass "el <head> de /servicios apunta a /en/services"
  else
    c_fail "el <head> de /servicios NO apunta a /en/services"
    echo "$h" | sed 's/^/          /'
  fi
  CHECKS=$((CHECKS + 1))

  # 3. el header HTTP ya no debe traer alternates que contradigan al <head>
  n=$(hreflang_of /servicios | wc -l | tr -d ' ')
  check "sin alternates en el header Link de /servicios" "$n" "0"

  n=$(hreflang_of /en/services | wc -l | tr -d ' ')
  check "sin alternates en el header Link de /en/services" "$n" "0"

  # 4. regresion: borrar los alternates no debe llevarse puesto el preload
  #    de fuentes, que viaja en el mismo header Link
  n=$(headers / | grep -i '^link:' | tr ',' '\n' | count 'rel=preload')
  check_num "el preload de fuentes sobrevive en el header Link" "$n" ge 1

  # 5. las URLs con slug cruzado canonicalizan a la real (diseno deliberado,
  #    ver src/lib/canonical.ts). NO son un defecto: se verifica que sigan asi.
  for pair in "/services:juan-tech.com/servicios" "/en/servicios:juan-tech.com/en/services"; do
    u="${pair%%:*}"; want="${pair##*:}"
    if fetch "$u" | grep -oE '<link rel="canonical"[^>]*>' | grep -q "$want\""; then
      c_pass "$u canonicaliza a $want"
    else
      c_fail "$u dejo de canonicalizar a $want"
    fi
    CHECKS=$((CHECKS + 1))
  done
}

# ── SEO-03: identidad y E-E-A-T ──────────────────────────────────────────────
v03() {
  hdr 3 "Identidad: LinkedIn, credencial, Person de la home"
  c_info "LinkedIn correcto confirmado por Juan: linkedin.com/in/juancangulo"

  for u in / /en /authors/juan-carlos-angulo /contact; do
    n=$(fetch "$u" | count 'juancarlosangulo')
    check "sin el handle incorrecto en $u" "$n" "0"
  done

  # credencial: ninguna fecha de hasCredential puede ser futura
  yr_now=$(date +%Y)
  future=$(fetch /authors/juan-carlos-angulo \
    | grep -oE '"datePublished":"[0-9]{4}' \
    | grep -oE '[0-9]{4}$' \
    | awk -v y="$yr_now" '$1 > y' | wc -l | tr -d ' ')
  check "sin credenciales con fecha futura" "$future" "0"

  # Person de la home con sameAs
  # mismo pipefail/EPIPE que se arreglo en el resto del archivo: sin has(),
  # un sameAs que aparece temprano en la home daria FAIL con el nodo presente.
  if has "$(fetch /)" '"sameAs"'; then
    c_pass "el Person de la home incluye sameAs"
  else
    c_fail "el Person de la home sigue sin sameAs"
  fi
  CHECKS=$((CHECKS + 1))
}

# ── SEO-04: 404 indexado ─────────────────────────────────────────────────────
v04() {
  hdr 4 "/blog/payloadcms-tutorial 404 indexado"
  s=$(status /blog/payloadcms-tutorial)
  if [ "$s" = "301" ] || [ "$s" = "308" ] || [ "$s" = "200" ]; then
    c_pass "/blog/payloadcms-tutorial resuelto (= $s -> $(redirect /blog/payloadcms-tutorial))"
  else
    c_fail "/blog/payloadcms-tutorial sigue en $s"
  fi
  CHECKS=$((CHECKS + 1))

  c_info "regresion: redirects de la migracion vieja"
  for u in /blog/tablas-hash /blog/canibalizacion-seo /blog/nextjs-seo /blog/big-o-notation; do
    check "redirect vivo en $u" "$(status "$u")" "308"
  done
}

# ── SEO-05: canibalizacion ───────────────────────────────────────────────────
v05() {
  hdr 5 "Consolidacion de grupos canibalizados"
  c_info "AJUSTAR esta lista segun cual URL gane en cada grupo tras revisar GSC"
  c_info "el efecto real se mide a 8-12 semanas con el conteo de keywords organicas"
  for u in /blog/seo/seo-copywriting-guide /blog/seo/seo-content-strategy \
           /blog/seo/topic-clusters-seo /blog/tech-seo/tech-seo-guide \
           /blog/seo/content-pillar /blog/seo/keyword-research-guide \
           /blog/tech-seo/nextjs-seo-optimization; do
    s=$(status "$u")
    if [ "$s" = "301" ] || [ "$s" = "308" ]; then
      c_pass "$u consolidada (= $s -> $(redirect "$u"))"
    else
      c_fail "$u sigue viva sin redirect (= $s)"
    fi
    CHECKS=$((CHECKS + 1))
  done
}

# ── SEO-06: performance ──────────────────────────────────────────────────────
v06() {
  hdr 6 "Performance: fuentes, cache, formato de imagen"
  c_info "baseline home: perf 46, LCP 7,9s, TTFB 3,82s, preload de fuentes 188,4 KB"

  # peso total de las fuentes precargadas
  total=0
  for f in $(headers / | tr ',' '\n' | grep -oE '/_next/static/media/[A-Za-z0-9._-]*\.woff2' | sort -u); do
    sz=$(curl -sS -o /dev/null -w '%{size_download}' --max-time 30 "${SITE}${f}")
    total=$((total + sz))
  done
  check_num "peso del preload de fuentes en bytes" "$total" lt 120000

  # el HTML debe poder cachearse
  cc=$(headers / | grep -i '^cache-control:' | tr -d '\r')
  if has_i "$cc" 'no-store'; then
    c_fail "el HTML sigue con no-store ($cc)"
  else
    c_pass "el HTML ya no manda no-store ($cc)"
  fi
  CHECKS=$((CHECKS + 1))

  # TTFB: la segunda request deberia ser mas rapida si hay cache
  c_info "TTFB en 5 requests seguidos (deberia bajar tras la primera):"
  for i in 1 2 3 4 5; do
    printf '          #%d  %ss\n' "$i" "$(curl -sS -o /dev/null -w '%{time_starttransfer}' --max-time 30 "$SITE/")"
  done

  # AVIF
  ct=$(curl -sSI --max-time 30 -H 'Accept: image/avif,image/webp,*/*' \
       "${SITE}/_next/image?url=%2F&w=640&q=75" | grep -i '^content-type:' | tr -d '\r')
  c_info "formato de imagen servido: ${ct:-desconocido}"
}

# ── SEO-07: traducciones ─────────────────────────────────────────────────────
v07() {
  hdr 7 "Paridad de contenido ES / EN"
  c_info "baseline: big-o-notation 4232/1279, react-19 1737/604"

  wc_of() {
    fetch "$1" | python3 -c "
import sys, re
h = sys.stdin.read()
h = re.sub(r'<script.*?</script>|<style.*?</style>', '', h, flags=re.S)
print(len(re.sub(r'<[^>]+>', ' ', h).split()))"
  }

  for p in /blog/cs-fundamentals/big-o-notation /blog/development/react-19; do
    es=$(wc_of "$p"); en=$(wc_of "/en$p")
    pct=$(echo "scale=0; $en * 100 / $es" | bc)
    check_num "paridad EN/ES en $p (ES:$es EN:$en)" "$pct" ge 80
  done
}

# ── SEO-08: meta descriptions ────────────────────────────────────────────────
v08() {
  hdr 8 "Meta descriptions"
  c_info "baseline: 15 rutas sin meta description, home con 37 caracteres"
  for p in /blog/cs-fundamentals/dynamic-programming /blog/cs-fundamentals/graph-algorithms \
           /blog/development/que-es-css /blog/cs-fundamentals/space-complexity \
           /blog/cs-fundamentals/tree-traversal /blog/development /blog/development/astro-vs-nextjs \
           /blog/development/headless-cms-comparison /blog/development/nextjs-cms \
           /blog/development/payload-cms-guide /blog/general /blog/seo/keyword-research-guide \
           /blog/tech-seo/auditoria-seo /blog/tech-seo/seo-on-page-guia \
           /blog/tech-seo/structured-data-seo /; do
    d=$(fetch "$p" | grep -oE '<meta name="description" content="[^"]*"' | head -1 | sed 's/.*content="//;s/"$//')
    len=${#d}
    if [ "$len" -ge 120 ] && [ "$len" -le 155 ]; then
      c_pass "meta description en $p ($len car.)"
    else
      c_fail "meta description en $p ($len car., esperado 120-155)"
    fi
    CHECKS=$((CHECKS + 1))
  done
}

# ── SEO-09: structured data ──────────────────────────────────────────────────
v09() {
  hdr 9 "Structured data"

  types_of() { fetch "$1" | grep -o '"@type":"[A-Za-z]*"' | sed 's/.*:"//;s/"//' | sort -u | tr '\n' ' '; }

  # El indice de servicios emite ItemList, no Service: lista cuatro ofertas, o
  # sea que no ES un servicio, y cada entrada apunta al landing que si lleva su
  # Service. Desvio deliberado del texto del issue, documentado en la quick
  # 260815-ngy; el baseline se corrige aca para que no pida schema incorrecto.
  for pair in "/servicios:ItemList" "/servicios/seo-consulting:Service" \
              "/blog:BreadcrumbList" "/en/services:ItemList"; do
    u="${pair%%:*}"; want="${pair##*:}"
    got=$(types_of "$u")
    if has "$got" "$want"; then
      c_pass "$u emite $want"
    else
      c_fail "$u no emite $want (tiene: ${got:-nada})"
    fi
    CHECKS=$((CHECKS + 1))
  done

  # Article con image y dateModified
  a=$(fetch /blog/tech-seo/nextjs-seo)
  for prop in '"image"' '"dateModified"'; do
    if has "$a" "$prop"; then c_pass "el Article incluye $prop"
    else c_fail "el Article no incluye $prop"; fi
    CHECKS=$((CHECKS + 1))
  done

  # nada de null ni strings vacios
  for u in /blog/tech-seo/nextjs-seo /en/blog/tech-seo/nextjs-seo; do
    n=$(fetch "$u" | count '"description":(null|"")')
    check "sin description null o vacia en $u" "$n" "0"
  done
}

# ── SEO-10: accesibilidad ────────────────────────────────────────────────────
v10() {
  hdr 10 "Accesibilidad"
  c_info "baseline: aria-valid-attr-value 6 rutas, heading-order 8, image-redundant-alt 6"
  c_info "la validacion real necesita Lighthouse. Corre:"
  c_info "  claude-seo run unlighthouse_run.py $SITE --device mobile --max-routes 40 \\"
  c_info "    --output-dir ./ulh-a11y --timeout 1500 --json"
  c_info "y despues: ./scripts/seo/validate-a11y.py ./ulh-a11y"

  # check barato que si se puede hacer sin Lighthouse: aria-controls huerfano
  for u in /blog /blog/tech-seo; do
    ids=$(fetch "$u" | grep -oE 'aria-controls="[^"]*"' | sed 's/.*="//;s/"//' | sort -u)
    orphan=0
    body=$(fetch "$u")
    for id in $ids; do
      has "$body" "id=\"$id\"" || orphan=$((orphan + 1))
    done
    check "sin aria-controls huerfano en $u" "$orphan" "0"
  done
}

# ── SEO-11: higiene ──────────────────────────────────────────────────────────
v11() {
  hdr 11 "Higiene tecnica"

  n=$(curl -sS --max-time 30 "$SITE/sitemap.xml" | count 'juan-tech\.com/websites<')
  check_num "/websites presente en el sitemap" "$n" ge 1

  if curl -sS --max-time 30 "$SITE/llms.txt" | grep -qi 'placeholder\|plumbing\|Phase [0-9]'; then
    c_fail "llms.txt sigue filtrando nomenclatura interna de fases"
  else
    c_pass "llms.txt sin referencias internas"
  fi
  CHECKS=$((CHECKS + 1))

  h=$(headers /)
  for want in 'strict-transport-security' 'x-content-type-options'; do
    if has_i "$h" "$want:"; then c_pass "header $want presente"
    else c_fail "header $want ausente"; fi
    CHECKS=$((CHECKS + 1))
  done

  # el form en ES no debe estar rotulado en ingles
  n=$(fetch / | count 'placeholder="(Name|Email|Message)"')
  check "form de la home rotulado en espanol" "$n" "0"

  s=$(status /es)
  if [ "$s" = "301" ] || [ "$s" = "308" ]; then
    c_pass "/es redirige permanente (= $s)"
  else
    c_fail "/es sigue en $s (esperado 301 o 308)"
  fi
  CHECKS=$((CHECKS + 1))
}

# ── main ─────────────────────────────────────────────────────────────────────

if [ $# -eq 0 ]; then
  sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
  exit 2
fi

TARGETS=("$@")
if [ "${1:-}" = "all" ]; then TARGETS=(1 2 3 4 5 6 7 8 9 10 11); fi

printf '\033[1mValidando %s\033[0m  (%s)\n' "$SITE" "$(date '+%Y-%m-%d %H:%M')"

for n in "${TARGETS[@]}"; do
  case "$n" in
    1) v01 ;; 2) v02 ;; 3) v03 ;; 4) v04 ;; 5) v05 ;; 6) v06 ;;
    7) v07 ;; 8) v08 ;; 9) v09 ;; 10) v10 ;; 11) v11 ;;
    *) echo "issue desconocido: $n" >&2; exit 2 ;;
  esac
done

echo
if [ $FAILED -eq 0 ]; then
  printf '\033[32m%d checks, todos pasan.\033[0m\n' "$CHECKS"
else
  printf '\033[31m%d checks, hay fallos. El issue NO se cierra.\033[0m\n' "$CHECKS"
fi
exit $FAILED
