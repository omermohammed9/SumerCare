FROM node:24-alpine AS builder

WORKDIR /app

COPY . .

RUN npm ci

RUN npm run build -w apps/appointment-scheduling-service

RUN npm prune --omit=dev --ignore-scripts

# -- Production Stage ----------------------------------------
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/appointment-scheduling-service/package*.json ./apps/appointment-scheduling-service/
COPY --from=builder /app/apps/appointment-scheduling-service/dist ./apps/appointment-scheduling-service/dist

USER node

EXPOSE 8000

WORKDIR /app/apps/appointment-scheduling-service
CMD ["node", "dist/server.js"]
