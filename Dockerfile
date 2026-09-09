# Stage 1: Build the static site
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve static files with nginx + run the leaderboard API on Node.
# Both processes live in one container so the SPCS service spec (and therefore
# the public endpoint URL) never has to change.
FROM nginx:alpine
RUN apk add --no-cache nodejs
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY api/ /srv/api/
COPY docker-entrypoint.sh /docker-entrypoint-atlas.sh
RUN chmod +x /docker-entrypoint-atlas.sh
EXPOSE 8080
CMD ["/docker-entrypoint-atlas.sh"]
