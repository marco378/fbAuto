# Base image
FROM node:18

WORKDIR /app

# Install system dependencies (optional, if needed for Puppeteer etc.)
RUN apt-get update && apt-get install -y \
    wget ca-certificates fonts-liberation libasound2 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdbus-1-3 libdrm2 libgbm1 libnspr4 libnss3 libx11-xcb1 libxcomposite1 \
    libxdamage1 libxfixes3 libxrandr2 xdg-utils && rm -rf /var/lib/apt/lists/*

# Copy server package files
COPY fbAuto-main/server/package*.json ./

# Install dependencies
RUN npm install --production

# Copy the entire source (server + automation)
COPY fbAuto-main/server ./
COPY fbAuto-main/src ./src

# Expose port
EXPOSE 8080

# Start command
CMD ["npm", "start"]