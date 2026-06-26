# Build frontend assets
FROM node:20-alpine AS frontend-builder
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
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

# Ensure backend build context stability
WORKDIR /app/backend
COPY backend/go.mod backend/go.sum ./
COPY backend ./

# Copy utils (needed for sqlite DB generation)
WORKDIR /app
COPY utils ./utils

# Install Go dependencies
WORKDIR /app/backend
RUN go mod tidy

# Make necessary directory for database
RUN mkdir -p /app/data

# Build SQLite database if not exists
WORKDIR /app
RUN cd utils && npm install && npm run buildDatabase

# Build backend binary
WORKDIR /app/backend
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/czn-tracker .

# Final image
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=backend-builder /app/czn-tracker .
COPY --from=backend-builder /app/data ./data
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY --from=backend-builder /app/utils ./utils
EXPOSE 8080

ENV FRONTEND_URL=http://localhost:5173 BACKEND_URL=http://localhost:8080

CMD ["/app/czn-tracker"]
