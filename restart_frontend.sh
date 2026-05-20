#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG="$DIR/frontend.log"

echo "==> Stopping existing vite process..."
pkill -f "vite" 2>/dev/null && echo "    stopped." || echo "    (none running)"

echo "==> Pulling latest code..."
cd "$DIR"
git pull origin main

echo "==> Installing dependencies..."
npm install --silent

echo "==> Starting frontend..."
nohup npm run dev > "$LOG" 2>&1 &
echo "    PID $! — logs: $LOG"
