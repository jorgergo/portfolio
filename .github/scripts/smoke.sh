#!/usr/bin/env bash
# Spec 0007 smoke check: asks the live site whether it serves the build in
# dist/. `pages` checks the bytes, headers, share image, and 404 (a failure
# rolls the deploy back); `redirects` checks the www and http 301s. Every
# expectation comes from dist/, so run it from the repo root after building the
# commit that is live. SMOKE_ORIGIN points it at another server, such as
# `pnpm preview` on http://localhost:8787. Runs on bash 3.2 (macOS) and needs
# only curl, grep, sed, and cmp.
set -euo pipefail

mode=${1:-}
dist=dist
attempts=10
pause=15

case $mode in
  pages | redirects) ;;
  *)
    echo 'usage: bash .github/scripts/smoke.sh pages|redirects' >&2
    exit 1
    ;;
esac

# The first match of a pattern in a file, or nothing.
first() {
  { grep -o -- "$1" "$2" || true; } | sed -n 1p
}

canonical=$(first '<link rel="canonical" href="[^"]*"' "$dist/index.html" |
  sed 's/.*href="//; s/"$//')
origin=${SMOKE_ORIGIN:-$canonical}
origin=${origin%/}
host=${origin#*://}
stylesheet=$(first '/_astro/[^"]*\.css' "$dist/index.html")

if [ -z "$origin" ] || [ -z "$stylesheet" ]; then
  echo "no canonical link or /_astro/ stylesheet in $dist/index.html" >&2
  exit 1
fi

trim() {
  local text=$1
  text=${text#"${text%%[![:space:]]*}"}
  text=${text%"${text##*[![:space:]]}"}
  printf '%s' "$text"
}

# One block of dist/_headers as `Name: value` lines. A line starting with `/`
# opens a block; indented lines belong to it until the next unindented line;
# blank and `#` lines are skipped.
block() {
  local want=$1 current='' line text
  while IFS= read -r line || [ -n "$line" ]; do
    line=${line%$'\r'}
    text=$(trim "$line")
    case $line in
      '' | '#'*) ;;
      /*) current=$text ;;
      [[:space:]]*)
        case $text in '' | '#'*) continue ;; esac
        if [ "$current" = "$want" ]; then
          printf '%s: %s\n' "$(trim "${text%%:*}")" "$(trim "${text#*:}")"
        fi
        ;;
      *) current='' ;;
    esac
  done <"$dist/_headers"
}

all_headers=$(block '/*')
cache_headers=$(block '/_astro/*')

if [ -z "$all_headers" ] || [ -z "$cache_headers" ]; then
  echo "no /* or /_astro/* block in $dist/_headers" >&2
  exit 1
fi

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Requests one URL: the status in $status, the body in $tmp/body, the headers
# (with \r stripped) in $tmp/headers. A connection or TLS error leaves status
# 000, a failed attempt rather than a crash.
status=''
fetch() {
  : >"$tmp/body"
  : >"$tmp/raw"
  status=$(curl -sS --max-time 20 -A "portfolio-smoke/${GITHUB_SHA:-local}" \
    -H 'Accept-Encoding: identity' -o "$tmp/body" -D "$tmp/raw" \
    -w '%{http_code}' "$1") || true
  sed $'s/\r$//' "$tmp/raw" >"$tmp/headers"
}

problem=''
miss() {
  problem="$1 expected $2 got $3"
  return 1
}

# The response lines for one header name, joined, or `none`.
got_header() {
  local lines
  lines=$({ grep -i "^$1:" "$tmp/headers" || true; } | sed -n 'H; ${x; s/^\n//; s/\n/ | /g; p;}')
  printf '%s' "${lines:-none}"
}

check_status() {
  [ "$status" = "$2" ] || miss "$1 status" "$2" "$status"
}

check_bytes() {
  cmp -s "$tmp/body" "$2" || miss "$1 body" "the bytes of $2" 'different bytes'
}

# One `Name: value` line: the name in any case, the value exactly. A value
# merged with commas or sent twice fails, on purpose.
check_header() {
  grep -i -x -F -q -- "$2" "$tmp/headers" ||
    miss "$1 header" "$2" "$(got_header "${2%%:*}")"
}

check_headers() {
  local line
  while IFS= read -r line; do
    check_header "$1" "$line" || return 1
  done <<EOF
$2
EOF
}

check_not_immutable() {
  if grep -i -q '^cache-control:.*immutable' "$tmp/headers"; then
    miss "$1 cache-control" 'no immutable' "$(got_header cache-control)"
  fi
}

check_page() {
  fetch "$origin$1"
  check_status "$1" 200 || return 1
  check_bytes "$1" "$dist/$2" || return 1
  check_headers "$1" "$all_headers" || return 1
  check_not_immutable "$1"
}

check_pages() {
  check_page / index.html || return 1
  check_page /cv cv.html || return 1

  fetch "$origin$stylesheet"
  check_status "$stylesheet" 200 || return 1
  check_headers "$stylesheet" "$cache_headers" || return 1

  fetch "$origin/og/cv.png"
  check_status /og/cv.png 200 || return 1
  check_header /og/cv.png 'content-type: image/png' || return 1

  fetch "$origin/missing"
  check_status /missing 404 || return 1
  check_bytes /missing "$dist/404.html"
}

check_redirect() {
  fetch "$1"
  check_status "$1" 301 || return 1
  check_header "$1" "location: https://$host/cv?ref=smoke"
}

check_redirects() {
  check_redirect "https://www.$host/cv?ref=smoke" || return 1
  check_redirect "http://$host/cv?ref=smoke"
}

echo "smoke $mode: $origin"
attempt=1
while ! "check_$mode"; do
  echo "attempt $attempt/$attempts: $problem"
  if [ "$attempt" -ge "$attempts" ]; then
    exit 1
  fi
  attempt=$((attempt + 1))
  sleep "$pause"
done
echo "attempt $attempt/$attempts: every check passed"
