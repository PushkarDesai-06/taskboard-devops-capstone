# ---------- stage 1: build the static bundle with Node ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- stage 2: serve dist/ with unprivileged Nginx ----------
# Node, npm and node_modules stay behind in the build stage.
FROM nginxinc/nginx-unprivileged:stable-alpine
# pick up Alpine security fixes released after the base image was built
USER root
RUN apk upgrade --no-cache
USER 101
ENV BACKEND_URL=http://backend:8000
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
