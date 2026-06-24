# Build frontend assets
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/vite.config.ts frontend/tsconfig.json frontend/tsconfig.node.json frontend/index.html ./
COPY frontend/src ./src
RUN npm install
RUN npm run build

# Build backend binary and include frontend assets
FROM golang:1.25-alpine AS backend-builder
RUN apk add --no-cache git
WORKDIR /app/backend
COPY backend/go.mod backend/main.go ./
RUN go mod tidy
COPY --from=frontend-builder /app/frontend/dist ../frontend/dist
RUN CGO_ENABLED=0 GOOS=linux go build -o czn-tracker .

# Final image
FROM alpine:3.19
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=backend-builder /app/backend/czn-tracker .
COPY --from=backend-builder /app/frontend/dist ./frontend/dist
EXPOSE 8080
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV FRONTEND_URL=http://localhost:5173 BACKEND_URL=http://localhost:8080

CMD ["/entrypoint.sh"]
