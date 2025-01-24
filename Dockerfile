# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install ffmpeg for media processing
RUN apk add --no-cache ffmpeg

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create media directories
RUN mkdir -p media/movies media/series media/movie_series media/downloads

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"] 