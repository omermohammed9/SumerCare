FROM node:24-alpine AS builder

WORKDIR /app

COPY . .

RUN npm ci

RUN npm run build -w apps/billing-service

RUN npm prune --omit=dev

# -- Production Stage ----------------------------------------
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/billing-service/package*.json ./apps/billing-service/
COPY --from=builder /app/apps/billing-service/dist ./apps/billing-service/dist

USER node

EXPOSE 9000

WORKDIR /app/apps/billing-service
CMD ["node", "dist/server.js"]
