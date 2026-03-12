FROM node:20-alpine AS build
WORKDIR /workspace/admin-portal
COPY admin-portal/package*.json ./
RUN npm ci
COPY admin-portal/ ./
COPY platform-config/ /workspace/platform-config/
RUN npm run build

FROM nginx:alpine
COPY infra/docker/nginx/admin-portal.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/admin-portal/dist /usr/share/nginx/html
EXPOSE 80
