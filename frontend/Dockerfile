# ============================================================
# MediNexus Frontend — multi-stage Dockerfile
# ============================================================

FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- development ----
FROM base AS development
ENV NODE_ENV=development
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ---- build ----
FROM base AS build
RUN npm install
COPY . .
RUN npm run build

# ---- production (served by nginx) ----
FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
