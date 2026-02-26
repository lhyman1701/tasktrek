# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Copy root package files and config
COPY package*.json ./
COPY tsconfig*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/api/package*.json ./packages/api/

# Install dependencies
RUN npm ci --workspace=@taskflow/shared --workspace=@taskflow/api

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/api ./packages/api

# Build shared package first, then API
RUN npm run build --workspace=@taskflow/shared
RUN npm run build --workspace=@taskflow/api

# Generate Prisma client
RUN npx prisma generate --schema=packages/api/prisma/schema.prisma

# Compile seed script
RUN npx tsc packages/api/prisma/seed.ts --outDir packages/api/prisma --esModuleInterop --module ESNext --moduleResolution node

# Production stage
FROM node:20-slim AS production

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/bash nodejs

# Copy package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/api/package*.json ./packages/api/

# Install production dependencies only
RUN npm ci --omit=dev --workspace=@taskflow/shared --workspace=@taskflow/api

# Copy built files
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/packages/api/prisma ./packages/api/prisma
COPY --from=builder /app/packages/api/scripts ./packages/api/scripts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Change ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Set working directory to API
WORKDIR /app/packages/api

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Start the application
CMD ["node", "dist/index.js"]
