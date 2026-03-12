# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Non-root user for security
RUN addgroup -S mytelco && adduser -S mytelco -G mytelco && \
    chown -R mytelco:mytelco /usr/share/nginx/html && \
    chown -R mytelco:mytelco /var/cache/nginx && \
    chown -R mytelco:mytelco /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R mytelco:mytelco /var/run/nginx.pid

USER mytelco:mytelco

EXPOSE 80

# Health check - nginx responds on port 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
