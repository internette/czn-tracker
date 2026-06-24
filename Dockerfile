# Build frontend assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/vite.config.ts frontend/tsconfig.json frontend/tsconfig.node.json frontend/index.html ./
COPY frontend/src ./src
RUN npm install
RUN npm run build

# Build backend binary and include frontend assets
FROM golang:1.25-alpine AS backend-builder

# Install required tooling (git + node for sqlite DB build)
RUN apk add --no-cache git nodejs npm

# Set working directory to app root
WORKDIR /app

# Copy backend source
COPY backend/go.mod backend/main.go ./backend/

# Copy utils (needed for sqlite DB generation)
COPY utils ./utils

# Install Go dependencies
RUN cd backend && go mod tidy

# Build SQLite database if not exists
RUN cd utils && npm install && npm run buildDatabase

# Build backend binary
RUN CGO_ENABLED=0 GOOS=linux go build -o czn-tracker ./backend

# Final image
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=backend-builder /app/backend/czn-tracker .
COPY --from=backend-builder /app/frontend/dist ./frontend/dist
COPY --from=backend-builder /app/utils ./utils
EXPOSE 8080

ENV FRONTEND_URL=http://localhost:5173 BACKEND_URL=http://localhost:8080

CMD ["/czn-tracker"]
