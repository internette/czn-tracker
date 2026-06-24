# CZn Tracker

A React + Go app for managing your characters, decks, and teams with Google login authentication.

## Setup

1. Create Google OAuth credentials at https://console.developers.google.com/apis/credentials.
   - Set the authorized redirect URI to `http://localhost:8080/auth/google/callback`.
2. In your terminal, set environment variables:

```bash
export GOOGLE_CLIENT_ID=your-client-id
export GOOGLE_CLIENT_SECRET=your-client-secret
export COOKIE_HASH_KEY=some-random-secret
export FRONTEND_URL=http://localhost:5173
export BACKEND_URL=http://localhost:8080
```

3. Start the backend:

```bash
cd backend
go mod tidy
go run main.go
```

Optional SQLite storage:

```bash
export STORAGE_ENGINE=sqlite
export SQLITE_PATH=czn-tracker.db
```

If you do not specify `STORAGE_ENGINE`, the app will use the JSON `data.json` fallback.

4. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

## Features

- Google login authentication
- List characters and view detailed character pages
- Save decks for each character
- Build and save teams from your owned characters

## Docker

Build the single-container image from the repository root:

```bash
docker build -t czn-tracker .
```

Create a local `.env` file from the example:

```bash
cp .env.example .env
```

Update `.env` with your Google OAuth credentials and any storage settings.

Run the container with the env file:

```bash
docker run --env-file .env -p 8080:8080 czn-tracker
```

Or use Docker Compose:

```bash
docker compose up --build
```

Then open `http://localhost:8080` in your browser.

## Development with Vite Live Reload

For local development with frontend live reload:

```bash
docker compose -f docker-compose.dev.yml up --build
```

This runs:
- Backend on `http://localhost:8080`
- Frontend (Vite dev server) on `http://localhost:5173` with live reload

Stop the dev environment:

```bash
docker compose -f docker-compose.dev.yml down
```

Restart:

```bash
docker compose -f docker-compose.dev.yml up
```
