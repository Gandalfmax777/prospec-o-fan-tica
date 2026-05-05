# syntax=docker/dockerfile:1.7

# ============================================================
# Stage 1 — build: gera os artefatos estáticos do Vite
# ============================================================
FROM node:22-alpine AS build

WORKDIR /app

ARG VITE_API_URL
ARG VITE_BETTER_AUTH_URL
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_BETTER_AUTH_URL=${VITE_BETTER_AUTH_URL}

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================================
# Stage 2 — runner: nginx servindo o /dist na porta 80
# ============================================================
FROM nginx:1.27-alpine AS runner

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
