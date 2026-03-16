# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci

# Copy Prisma schema first so we can generate the client
COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src
# Compile TypeScript (rootDir=. so it outputs src/ and prisma/ to dist/)
RUN npm run build

# ── Stage 2: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner

# Prisma engine binaries require OpenSSL
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

# Copy only what we need to run
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Install production deps + regenerate Prisma client for this OS
RUN npm ci --omit=dev && npx prisma generate

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/src/index.js"]
