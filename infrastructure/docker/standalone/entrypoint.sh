#!/bin/bash
# Runs the whole portal in one container: fake EIOS (DEMO=1), backend on 127.0.0.1:8000, nginx on :8080.
# The container stops as soon as any of them exits, so `docker compose ps` never shows a half-dead portal.
set -euo pipefail
trap 'kill $(jobs -p) 2>/dev/null; wait; exit 0' TERM INT

DATA=/app/data

# A stable JWT secret per data volume: sessions survive restarts, and nothing secret lives in the image.
if [ -z "${SECRET_KEY:-}" ]; then
  [ -s "$DATA/secret_key" ] || (umask 077; python -c 'import secrets; print(secrets.token_urlsafe(48))' > "$DATA/secret_key")
  SECRET_KEY=$(cat "$DATA/secret_key")
  export SECRET_KEY
fi

if [ "${DEMO:-0}" = "1" ]; then
  export EIOS_BASE_URL=http://127.0.0.1:9000/api
  export ADMIN_USERNAME=${ADMIN_USERNAME:-portal_admin}
  export ADMIN_PASSWORD=${ADMIN_PASSWORD:-demo-admin}
  python /app/demo/demo_eios.py &
fi

uvicorn main:app --host 127.0.0.1 --port 8000 --proxy-headers --forwarded-allow-ips=127.0.0.1 &

healthy=0
for _ in $(seq 60); do
  if python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/v1/health', timeout=2)" 2>/dev/null; then
    healthy=1
    break
  fi
  sleep 1
done
if [ "$healthy" != 1 ]; then
  echo "Backend did not become healthy in 60s, see the log above." >&2
  exit 1
fi

if [ "${DEMO:-0}" = "1" ] && [ ! -e "$DATA/.demo-seeded" ]; then
  if python /app/demo/seed_demo.py "$ADMIN_USERNAME" "$ADMIN_PASSWORD"; then
    touch "$DATA/.demo-seeded"
  else
    echo "Demo content was not added; the portal still works without it." >&2
  fi
fi

nginx -e stderr -g 'daemon off;' &

echo "Portal is up: http://localhost:${PORT:-8080}"

set +e
wait -n
status=$?
echo "A portal process exited with status $status, stopping the container." >&2
kill $(jobs -p) 2>/dev/null
wait
exit "$status"
