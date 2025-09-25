# Stage 1: install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: build application
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:gen
RUN npm run build

# Stage 3: production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/dev.db"

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3000
CMD ["npm", "run", "start"]
