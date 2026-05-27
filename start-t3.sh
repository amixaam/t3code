#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="/tmp/t3-server.log"
PID_FILE="/tmp/t3-server.pid"

# Kill any existing T3 server processes (watcher + child)
pkill -f "node.*src/bin.ts" 2>/dev/null || true
sleep 1
rm -f "$PID_FILE"

# Resolve Tailscale IP
TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "100.70.125.89")

echo "Starting T3 Code server on $TAILSCALE_IP:13773 ..."

cd "$SCRIPT_DIR/apps/server"

T3CODE_HOST="$TAILSCALE_IP" \
T3CODE_PORT=13773 \
T3CODE_HOME="$HOME/.t3" \
    nohup node --watch src/bin.ts > "$LOG_FILE" 2>&1 &

SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

# Wait for the server to be ready
echo -n "Waiting for server to start"
for _ in $(seq 1 30); do
    if grep -q "Listening on" "$LOG_FILE" 2>/dev/null; then
        echo ""
        echo "Server started (PID $SERVER_PID)."
        grep "pairingUrl\|Listening on" "$LOG_FILE"
        echo "  Logs: $LOG_FILE"
        exit 0
    fi
    echo -n "."
    sleep 1
done

echo ""
echo "Server may still be starting. Check logs: tail -f $LOG_FILE"
echo "PID: $SERVER_PID"
