FROM node:24-alpine AS builder

WORKDIR /app

COPY . .

RUN npm ci

RUN npm run build -w apps/medical-records-service

RUN npm prune --omit=dev

# -- Production Stage ----------------------------------------
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/medical-records-service/package*.json ./apps/medical-records-service/
COPY --from=builder /app/apps/medical-records-service/dist ./apps/medical-records-service/dist

USER node

EXPOSE 7000

WORKDIR /app/apps/medical-records-service
CMD ["node", "dist/server.js"]
