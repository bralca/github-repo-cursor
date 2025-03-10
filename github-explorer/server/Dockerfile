# Use Node.js LTS as base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Production image
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Create volume for logs
VOLUME /app/logs

# Expose port
EXPOSE 3001

# Set user to non-root
USER node

# Command to run the application
CMD ["node", "dist/index.js"] 