# -------- Shared Alpine base with required libs --------
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache libc6-compat openssl

# -------- deps --------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# -------- builder --------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# -------- runner --------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_URL="file:/data/dev.db"

# copy runtime artifacts
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY package.json package-lock.json ./

# ✅ Generate Prisma client *in the runner image*
RUN npx prisma generate

VOLUME ["/data"]
EXPOSE 3000
CMD ["npm","run","start"]
