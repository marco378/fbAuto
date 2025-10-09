# Use Node.js 18 LTS
FROM node:18-slim

# Install required dependencies for Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libgconf-2-4 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libcups2 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY fbAuto-main/package*.json ./fbAuto-main/
COPY fbAuto-main/server/package*.json ./fbAuto-main/server/

# Install dependencies
RUN cd fbAuto-main && npm install
RUN cd fbAuto-main/server && npm install

# Install Playwright browsers
RUN cd fbAuto-main && npx playwright install chromium

# Copy source code
COPY fbAuto-main/ ./fbAuto-main/

# Generate Prisma client
RUN cd fbAuto-main/server && npx prisma generate

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV HEADLESS=true
ENV DEBUG=false
ENV SLOWMO=0
ENV PORT=5000

# Start the application
CMD ["node", "fbAuto-main/server/src/index.js"]