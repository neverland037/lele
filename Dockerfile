FROM node:22-alpine

# Set working directory
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application files
COPY . .

# Ensure data and uploads directories exist
RUN mkdir -p /app/data /app/public/uploads

# Expose server port
EXPOSE 3000

# Define persistent storage volumes for Coolify
VOLUME ["/app/data", "/app/public/uploads"]

# Start the application
CMD ["npm", "start"]
