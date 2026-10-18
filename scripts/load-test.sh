#!/usr/bin/env bash
# Controlled load generator for the HPA demo.
#
#   ./scripts/load-test.sh start [workers]   # default 6 busybox pods hammering the backend
#   ./scripts/load-test.sh stop
#
# Watch it in another terminal:
#   kubectl get hpa -n taskboard -w
#   kubectl top pods -n taskboard
set -euo pipefail

NAMESPACE="${NAMESPACE:-taskboard}"
TARGET="${TARGET:-http://taskboard-backend:8000/api/tasks/stats}"
ACTION="${1:-start}"
WORKERS="${2:-6}"

case "$ACTION" in
  start)
    for i in $(seq 1 "$WORKERS"); do
      kubectl run "loadgen-$i" -n "$NAMESPACE" --image=busybox:1.36 --restart=Never \
        --labels=app=loadgen -- /bin/sh -c "while true; do wget -q -O /dev/null $TARGET; done"
    done
    echo "started $WORKERS load generators against $TARGET"
    ;;
  stop)
    kubectl delete pod -n "$NAMESPACE" -l app=loadgen --wait=false
    echo "load generators stopped; HPA scales back down after its stabilization window"
    ;;
  *)
    echo "usage: $0 start [workers] | stop" >&2
    exit 1
    ;;
esac
