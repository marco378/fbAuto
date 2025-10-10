# Start from Node.js slim image
FROM node:20-bullseye-slim

# Set working directory
WORKDIR /app

# Install required system dependencies for Playwright Chromium
RUN apt-get update && apt-get install -y \
    wget \ 
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
 && rm -rf /var/lib/apt/lists/*

# Copy server package files and install dependencies
COPY server/package*.json ./
RUN npm install

# Copy the rest of the server files
COPY server/ .

# Generate Prisma client (only if schema exists)
RUN [ -f prisma/schema.prisma ] && npx prisma generate || echo "No Prisma schema found"

# Expose your app's port
EXPOSE 5000

# Start the server
CMD ["npm", "start"]