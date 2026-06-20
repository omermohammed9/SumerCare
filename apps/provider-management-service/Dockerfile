FROM node:24-alpine AS builder

WORKDIR /app

COPY . .

RUN npm ci

RUN npm run build -w apps/provider-management-service

RUN npm prune --omit=dev

# -- Production Stage ----------------------------------------
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/provider-management-service/package*.json ./apps/provider-management-service/
COPY --from=builder /app/apps/provider-management-service/dist ./apps/provider-management-service/dist

USER node

EXPOSE 6000

WORKDIR /app/apps/provider-management-service
CMD ["node", "dist/server.js"]
