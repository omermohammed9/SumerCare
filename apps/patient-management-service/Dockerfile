FROM node:24-alpine AS builder

WORKDIR /app

COPY . .

RUN npm ci

RUN npm run build -w apps/patient-management-service

RUN npm prune --omit=dev --ignore-scripts

# -- Production Stage ----------------------------------------
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/patient-management-service/package*.json ./apps/patient-management-service/
COPY --from=builder /app/apps/patient-management-service/dist ./apps/patient-management-service/dist

USER node

EXPOSE 5000

WORKDIR /app/apps/patient-management-service
CMD ["node", "dist/server.js"]
