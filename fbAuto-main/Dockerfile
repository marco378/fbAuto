# Start from Node.js slim image
FROM # Install server-specific dependencies 
WORKDIR /app/server
RUN [ -f package.json ] && npm install || echo "No server-specific package.json found"

# Generate Prisma client (only if schema exists)
RUN [ -f prisma/schema.prisma ] && npx prisma generate || echo "No Prisma schema found"

# Back to root
WORKDIR /app

# Expose your app's port
EXPOSE 5000

# Create a startup script that handles database setup
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "Starting application..."\n\
\n\
# Navigate to server directory\n\
cd /app/server\n\
\n\
# Check if DATABASE_URL is set\n\
if [ -z "$DATABASE_URL" ]; then\n\
  echo "WARNING: DATABASE_URL not set. Database operations may fail."\n\
else\n\
  echo "Database URL configured"\n\
  \n\
  # Run Prisma migrations if schema exists\n\
  if [ -f "prisma/schema.prisma" ]; then\n\
    echo "Running Prisma migrations..."\n\
    npx prisma migrate deploy || echo "Migration failed, continuing..."\n\
  fi\n\
fi\n\
\n\
# Start the application\n\
echo "Starting Node.js server..."\n\
exec node src/index.js' > /app/start.sh && chmod +x /app/start.sh

# Use the startup script
CMD ["/app/start.sh"]eye-slim

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

# Copy the entire project first
COPY . .

# Create cookies directories (gitignored)
RUN mkdir -p ./cookies && mkdir -p ./server/cookies

# Install root dependencies if package.json exists (for Playwright)
RUN [ -f package.json ] && npm install || echo "No root package.json found"

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
