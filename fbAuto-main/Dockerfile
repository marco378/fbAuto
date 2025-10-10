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

# Copy only package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project
COPY . .

# Create cookies directories (gitignored)
RUN mkdir -p ./cookies && mkdir -p ./server/cookies

# Install server-specific dependencies and generate Prisma client
WORKDIR /app/server
RUN [ -f package.json ] && npm install || echo "No server-specific package.json found"
RUN npx prisma generate

# Back to root
WORKDIR /app

# Expose your app’s port
EXPOSE 5000

# Start your server
CMD ["node", "server/src/index.js"]
