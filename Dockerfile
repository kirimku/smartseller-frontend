# Build stage
FROM --platform=linux/amd64 node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all files
COPY . .

# Build the application for production
RUN npm run build:dev

# Production stage
FROM --platform=linux/amd64 node:18-alpine

# Set environment variables
ENV NODE_ENV=development
ENV PORT=4173

# Set working directory
WORKDIR /app

# Install PM2 globally and additional server dependencies
RUN npm install -g pm2 && \
    npm install express compression helmet cors connect-history-api-fallback

# Copy package files
COPY package*.json ./

# Copy built app from build stage
COPY --from=build /app/dist ./dist

# Copy server files (we'll create these separately)
COPY server.js ./
COPY pm2.config.json ./

# Create logs and pids directories for PM2
RUN mkdir -p logs pids

# Expose port
EXPOSE 5173

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:5173/health || exit 1

# Start the application
CMD ["pm2-runtime", "start", "pm2.config.json"]