# syntax=docker/dockerfile:1

# The traced server dependencies are pure JavaScript, so building on the host platform is safe for every target.
FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build && node scripts/trace-runtime.mjs

FROM node:22-alpine AS node

# Must match the Alpine release of node:22-alpine so the copied binary finds compatible musl and libstdc++.
FROM alpine:3.24 AS runtime
RUN apk add --no-cache libstdc++ \
  && addgroup -g 1000 node \
  && adduser -u 1000 -G node -s /sbin/nologin -D node
COPY --from=node /usr/local/bin/node /usr/local/bin/node
WORKDIR /app
ENV NODE_ENV=production \
  HOST=0.0.0.0 \
  PORT=4321 \
  NODE_OPTIONS=--max-old-space-size=160 \
  ASTRO_TELEMETRY_DISABLED=1
COPY --from=build --chown=node:node /app/.runtime ./
USER node
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
