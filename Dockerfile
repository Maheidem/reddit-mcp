# syntax=docker/dockerfile:1.7
#
# Reddit MCP Server — multi-stage container image.
#
# Build:  docker build -t reddit-mcp:<version> .
# Run:    docker run --rm -p 3101:3000 -e REDDIT_USER_AGENT=test reddit-mcp:<version>
# Health: curl http://localhost:3101/healthz
#
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production
ENV MCP_HTTP_HOST=0.0.0.0
ENV MCP_HTTP_PORT=3000
ENV MCP_DATA_DIR=/app/data
ENV MCP_CONFIG_DIR=/app/config
ENV MCP_LOG_DIR=/app/logs
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
RUN mkdir -p /app/data /app/config /app/logs && chown -R node:node /app
EXPOSE 3000
USER node
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD wget -qO- http://127.0.0.1:3000/healthz || exit 1
ENTRYPOINT ["node", "dist/index.js", "--transport", "http"]
