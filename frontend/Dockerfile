# ── Stage 1: build the static bundle ─────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Vite inlines env vars at BUILD time, not runtime — so the API URL has to be
# supplied here rather than when the container starts.
ARG VITE_BASE_URL=http://localhost:3001
ENV VITE_BASE_URL=$VITE_BASE_URL

RUN npm run build

# ── Stage 2: serve with nginx ────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
