#!/usr/bin/env bash
PID_FILE="/tmp/t3-server.pid"

if [[ ! -f "$PID_FILE" ]]; then
    echo "No PID file found. T3 server may not be running."
    exit 1
fi

PID=$(cat "$PID_FILE")

if kill -0 "$PID" 2>/dev/null; then
    echo "Stopping T3 server (PID $PID)..."
    kill "$PID"
    rm -f "$PID_FILE"
    echo "Stopped."
else
    echo "PID $PID is not running. Removing stale PID file."
    rm -f "$PID_FILE"
fi
