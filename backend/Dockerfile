# ── Stage 1: install every dependency and compile TypeScript ─────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Copied separately so a source-only change reuses the cached install layer.
COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: production dependencies only ────────────────────────────────
FROM node:22-alpine AS deps

WORKDIR /app
COPY package*.json ./
# bcrypt compiles a native addon; alpine needs a toolchain to build it.
RUN apk add --no-cache python3 make g++ \
    && npm ci --omit=dev \
    && apk del python3 make g++

# ── Stage 3: runtime ─────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# tini reaps zombies and forwards SIGTERM, so graceful shutdown actually fires.
RUN apk add --no-cache tini

COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY package.json ./

# Never run as root.
USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
