#!/bin/sh
set -e

# ensure frontend deps exist (use named volume so they're built for this container arch)
cd /app/frontend

# delete host's package-lock.json to force npm to build for this arch (arm64-musl)
rm -f package-lock.json

npm install

# make sure the DB dir exists (don't chmod; host perms control this)
mkdir -p /app/data

# start backend in background from /app so data/ resolves correctly
cd /app && /app/czn-tracker &
BACKEND_PID=$!
cd /app/frontend

# start vite dev server, listen on all interfaces
npm run dev -- --host 0.0.0.0 --port 5173

# wait for backend if frontend exits
wait $BACKEND_PID
