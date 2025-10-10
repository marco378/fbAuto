# Use Node 20 as base
FROM node:20-bullseye-slim

# Set working directory
WORKDIR /app

# Install system dependencies (optional, if needed for Puppeteer etc.)
RUN apt-get update && apt-get install -y \
    wget ca-certificates fonts-liberation libasound2 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdbus-1-3 libdrm2 libgbm1 libnspr4 libnss3 libx11-xcb1 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 xdg-utils && rm -rf /var/lib/apt/lists/*

# Copy dependency files from server
COPY fbAuto-main/server/package*.json ./

# Install Node dependencies
RUN npm install

# Copy all remaining app files
COPY fbAuto-main/server .

# Expose Railway port
EXPOSE 3000

# Run the app
CMD ["npm", "start"]