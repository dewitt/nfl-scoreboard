#!/usr/bin/env bash
set -euo pipefail

PORT=8080
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Find an available port starting at 8080
while lsof -i :"$PORT" &>/dev/null; do
  PORT=$((PORT + 1))
done

echo "Starting NFL Command Board on http://localhost:${PORT}..."

if command -v python3 &>/dev/null; then
  python3 -m http.server "$PORT" --directory "$DIR" &
  SERVER_PID=$!
elif command -v npx &>/dev/null; then
  npx serve "$DIR" -p "$PORT" &
  SERVER_PID=$!
else
  echo "Error: Neither python3 nor npx is installed."
  exit 1
fi

trap 'kill $SERVER_PID 2>/dev/null || true' EXIT

sleep 0.8
if command -v open &>/dev/null; then
  open "http://localhost:${PORT}"
fi

echo "NFL Command Board is running at http://localhost:${PORT} (PID: ${SERVER_PID})"
echo "Press Ctrl+C to stop."
wait "$SERVER_PID"
