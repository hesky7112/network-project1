# Stage 1: Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Stage 2: Build the application
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for production build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Build the application
RUN npm run build

# Stage 3: Production image
FROM nginx:alpine AS runner

# Copy the built assets from the builder stage
COPY --from=builder /app/public /usr/share/nginx/html/public
COPY --from=builder /app/.next/static /usr/share/nginx/html/_next/static
COPY --from=builder /app/.next/standalone/. /usr/share/nginx/html/
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# Set working directory
WORKDIR /usr/share/nginx/html

# Expose the port the app runs on
EXPOSE 80

# Start the application
CMD ["nginx", "-g", "daemon off;"]
