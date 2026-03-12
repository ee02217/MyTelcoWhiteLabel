FROM node:20-alpine AS build
WORKDIR /workspace/web-portal
COPY web-portal/package*.json ./
RUN npm ci
COPY web-portal/ ./
COPY platform-config/ /workspace/platform-config/
RUN npm run build

FROM nginx:alpine
COPY infra/docker/nginx/web-portal.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/web-portal/dist /usr/share/nginx/html
EXPOSE 80
