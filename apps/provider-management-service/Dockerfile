FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
# Since we are in a monorepo, we might need turbo or workspace setups. 
# For now, we install directly in this dir.
RUN npm install

COPY . .

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

# Non-root user
USER node

EXPOSE 6000

CMD ["node", "dist/server.js"]
