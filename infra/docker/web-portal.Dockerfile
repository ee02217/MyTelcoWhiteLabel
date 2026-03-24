FROM node:20-alpine AS build
WORKDIR /workspace/web-portal

ARG VITE_OIDC_ISSUER=http://localhost:8080/realms/mytelco-white-label
ARG VITE_OIDC_CLIENT_ID=web-portal
ARG VITE_OIDC_REDIRECT_URI=http://localhost:3000/callback
ARG VITE_OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:3000
ARG VITE_OIDC_SCOPES="openid roles"
ARG VITE_DEV_MODE=false
ARG VITE_USE_MOCK_DATA=false

ENV VITE_OIDC_ISSUER=$VITE_OIDC_ISSUER
ENV VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID
ENV VITE_OIDC_REDIRECT_URI=$VITE_OIDC_REDIRECT_URI
ENV VITE_OIDC_POST_LOGOUT_REDIRECT_URI=$VITE_OIDC_POST_LOGOUT_REDIRECT_URI
ENV VITE_OIDC_SCOPES=$VITE_OIDC_SCOPES
ENV VITE_DEV_MODE=$VITE_DEV_MODE
ENV VITE_USE_MOCK_DATA=$VITE_USE_MOCK_DATA

COPY web-portal/package*.json ./
RUN npm install
COPY web-portal/ ./
COPY platform-config/ /workspace/platform-config/
RUN npm run build

FROM nginx:alpine
COPY infra/docker/nginx/web-portal.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/web-portal/dist /usr/share/nginx/html
EXPOSE 80
