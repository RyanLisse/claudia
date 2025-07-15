# Multi-stage build for Claudia Tauri application
FROM node:20-alpine AS frontend-deps

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Copy package files
COPY frontend/package.json frontend/bun.lock* ./frontend/
COPY package.json bun.lock* ./

# Install dependencies using bun
RUN npm install -g bun@1.2.18
RUN bun install
RUN cd frontend && bun install

# Frontend build stage
FROM frontend-deps AS frontend-builder

WORKDIR /app

# Copy frontend source
COPY frontend/ ./frontend/
COPY src/ ./src/

# Build the frontend
RUN cd frontend && bun run build

# Rust build stage
FROM rust:1.75-alpine AS rust-builder

WORKDIR /app

# Install system dependencies for Tauri
RUN apk add --no-cache \
    musl-dev \
    pkgconfig \
    openssl-dev \
    webkit2gtk-dev \
    gtk+3.0-dev \
    ayatana-appindicator3-dev \
    librsvg-dev

# Copy Rust source
COPY src-tauri/ ./src-tauri/
COPY --from=frontend-builder /app/frontend/apps/web/out ./frontend/apps/web/out

# Build Rust application
WORKDIR /app/src-tauri
RUN cargo build --release

# Runtime stage
FROM alpine:3.18 AS runtime

# Install runtime dependencies
RUN apk add --no-cache \
    webkit2gtk \
    gtk+3.0 \
    ayatana-appindicator3 \
    librsvg \
    ca-certificates

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S claudia -u 1001

WORKDIR /app

# Copy built application
COPY --from=rust-builder /app/src-tauri/target/release/claudia /usr/local/bin/claudia
COPY --from=frontend-builder /app/frontend/apps/web/out ./frontend/apps/web/out

# Change ownership
RUN chown -R claudia:nodejs /app
USER claudia

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD claudia --version || exit 1

CMD ["claudia"]