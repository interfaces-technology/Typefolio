#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${SYNCFONT_PORT:-43123}"
HOST="${SYNCFONT_HOST:-127.0.0.1}"
BASE_URL="http://${HOST}:${PORT}"
APP_DIR="${ROOT_DIR}/apps/typefolio-native"

NEXT_PID=""
MAC_PID=""

log() {
  printf '==> %s\n' "$*"
}

stop_port() {
  local port="$1"
  local pids

  pids="$(lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    return 0
  fi

  log "Port ${port} is in use (PID: ${pids//$'\n'/, }). Stopping…"
  # shellcheck disable=SC2086
  kill ${pids} 2>/dev/null || true

  local attempt
  for attempt in {1..20}; do
    pids="$(lsof -ti "tcp:${port}" -sTCP:LISTEN 2>/dev/null || true)"
    if [[ -z "$pids" ]]; then
      log "Port ${port} is free."
      return 0
    fi
    sleep 0.25
  done

  log "Force-stopping remaining process(es) on port ${port}…"
  # shellcheck disable=SC2086
  kill -9 ${pids} 2>/dev/null || true
  sleep 0.5
}

wait_for_server() {
  local url="$1"
  local attempt

  for attempt in {1..120}; do
    if curl -sf "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done

  return 1
}

cleanup() {
  local exit_code=$?

  if [[ -n "$MAC_PID" ]] && kill -0 "$MAC_PID" 2>/dev/null; then
    log "Stopping macOS app (PID ${MAC_PID})…"
    kill "$MAC_PID" 2>/dev/null || true
  fi

  if [[ -n "$NEXT_PID" ]] && kill -0 "$NEXT_PID" 2>/dev/null; then
    log "Stopping Next.js (PID ${NEXT_PID})…"
    kill "$NEXT_PID" 2>/dev/null || true
  fi

  exit "$exit_code"
}

trap cleanup EXIT INT TERM

if [[ ! -d "$APP_DIR" ]]; then
  echo "Missing macOS app directory: $APP_DIR" >&2
  exit 1
fi

stop_port "$PORT"

log "Starting Next.js API on ${BASE_URL}…"
(
  cd "$ROOT_DIR"
  npm run dev:api
) &
NEXT_PID=$!

if ! wait_for_server "$BASE_URL"; then
  echo "Next.js did not become ready at ${BASE_URL}" >&2
  exit 1
fi

log "Next.js is ready."

log "Starting macOS app…"
(
  cd "$APP_DIR"
  swift run Typefolio
) &
MAC_PID=$!

log "Both processes are running."
log "  API: ${BASE_URL}"
log "  Mac app PID: ${MAC_PID}"
log "  Next.js PID: ${NEXT_PID}"
log "Press Ctrl+C to stop both."

wait "$MAC_PID"
