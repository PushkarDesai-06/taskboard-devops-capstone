#!/bin/sh
set -e

# The database may still be starting (docker compose, or a fresh Kubernetes rollout),
# so retry migrations for a while before giving up.
attempt=1
until alembic upgrade head; do
  if [ "$attempt" -ge 30 ]; then
    echo "database not reachable after $attempt attempts, giving up" >&2
    exit 1
  fi
  echo "migration attempt $attempt failed, retrying in 2s..." >&2
  attempt=$((attempt + 1))
  sleep 2
done

exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers "${WEB_CONCURRENCY:-1}"
