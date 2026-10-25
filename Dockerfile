# syntax=docker/dockerfile:1.7
# Multi-stage build using next.config.ts's `output: "standalone"`, so the
# runtime stage only needs the traced server bundle.
FROM node:22-slim AS base
# Prisma's query engine needs a real openssl on Debian.
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
# prisma.config.ts reads DATABASE_URL on load (postinstall's `prisma generate`
# too), so it must resolve even though generate never connects.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npm ci

# Full node_modules + source, for one-off commands rather than serving:
# `migrate` in docker-compose.yml, and `docker compose run --rm migrate npm run create_admin ...`.
FROM base AS tools
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
	NEXT_TELEMETRY_DISABLED=1 npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
	NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs \
	&& useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
