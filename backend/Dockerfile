# ============================================================
# MediNexus Backend — multi-stage Dockerfile
# ============================================================

# ---- base ----
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./

# ---- development ----
FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

# ---- build ----
FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# ---- production ----
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/database/migrations ./dist/database/migrations
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:4000/api/v1/health || exit 1
CMD ["node", "dist/server.js"]
