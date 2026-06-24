#!/bin/sh
set -e

# ensure frontend deps exist (use named volume so they're built for this container arch)
cd /app/frontend

# delete host's package-lock.json to force npm to build for this arch (arm64-musl)
rm -f package-lock.json

npm install

# make sure the DB dir exists (don't chmod; host perms control this)
mkdir -p /app/data

# start backend in background
/app/czn-tracker &
BACKEND_PID=$!

# start vite dev server, listen on all interfaces
npm run dev -- --host 0.0.0.0 --port 5173

# wait for backend if frontend exits
wait $BACKEND_PID

#!/bin/sh
set -e

echo "Starting czn-tracker in production mode..."

# move to app root
cd /app

# -------------------------
# Database initialization
# -------------------------

DB_PATH="./data/czn-tracker.db"

if [ ! -f "$DB_PATH" ]; then
  echo "Database not found. Initializing database..."
  cd ./utils
  npm run buildDatabase
  cd /app
else
  echo "Database already exists. Skipping init."
fi

# -------------------------
# Start backend (Cloud Run-safe)
# -------------------------

exec /app/czn-tracker