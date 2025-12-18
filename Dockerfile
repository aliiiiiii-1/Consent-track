# Multi-stage Docker build for Consent Track application
# Stage 1: Build dependencies and React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/

# Install all dependencies (including dev dependencies for building)
RUN npm ci --include=dev

# Copy client source code
COPY client/ ./client/

# Build React frontend
RUN npm run client:build

# Stage 2: Runtime with production dependencies only
FROM node:20-alpine AS runtime

# Create app directory
WORKDIR /app

# Copy package files for production dependencies
COPY package*.json ./
COPY server/package*.json ./server/

# Install only production dependencies
RUN npm ci --only=production

# Copy built client from builder stage
COPY --from=builder /app/client/build ./client/build

# Copy server files
COPY server/ ./server/

# Copy sessions directory
COPY sessions/ ./sessions/

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]