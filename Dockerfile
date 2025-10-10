# Use Node 18 as base image
FROM node:18

# Set working directory
WORKDIR /app

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    wget ca-certificates fonts-liberation libasound2 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdbus-1-3 libdrm2 libgbm1 libnspr4 libnss3 libx11-xcb1 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 xdg-utils && rm -rf /var/lib/apt/lists/*

# Copy package.json from the server folder
COPY fbAuto-main/server/package*.json ./

# Install production dependencies
RUN npm install --production

# Copy the server source code
COPY fbAuto-main/server/src ./src

# Copy the automation folder
COPY fbAuto-main/src/automation ./src/automation

# Copy the config folder  
COPY fbAuto-main/src/config ./src/config

# Copy Prisma schema if it exists
COPY fbAuto-main/server/prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Install Playwright browsers (at the end to avoid build failures)
RUN npx playwright install chromium --with-deps || echo "Playwright install failed, continuing..."

# Railway provides PORT environment variable dynamically
# No need to expose a specific port

# Start the app
CMD ["node", "src/index.js"]