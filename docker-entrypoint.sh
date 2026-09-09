#!/bin/sh
# Start the leaderboard API, then hand the foreground to nginx.
# If the API dies the container keeps serving the static site; the frontend
# falls back to localStorage so the app degrades rather than breaking.
set -e

node /srv/api/server.mjs &
API_PID=$!
echo "[entrypoint] leaderboard API started (pid $API_PID)"

# Surface an early API crash in the container logs without taking nginx down.
( sleep 5; kill -0 "$API_PID" 2>/dev/null || echo "[entrypoint] WARNING: API exited early" ) &

exec nginx -g 'daemon off;'
