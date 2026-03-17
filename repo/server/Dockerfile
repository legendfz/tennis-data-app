FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
COPY ../shared ./shared
RUN npm ci --omit=dev

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/prisma ./prisma
COPY --from=base /app/shared ../shared

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/server/src/index.js"]
