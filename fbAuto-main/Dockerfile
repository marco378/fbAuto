# Start from Node.js slim image# Start from Node.js slim image

FROM node:20-bullseye-slimFROM node:20-bullseye-slim



# Set working directory# Set working directory

WORKDIR /appWORKDIR /app



# Install required system dependencies for Playwright Chromium# Install required system dependencies for Playwright Chromium

RUN apt-get update && apt-get install -y \RUN apt-get update && apt-get install -y \

    wget \     wget \ 

    ca-certificates \    ca-certificates \

    fonts-liberation \    fonts-liberation \

    libasound2 \    libasound2 \

    libatk1.0-0 \    libatk1.0-0 \

    libatk-bridge2.0-0 \    libatk-bridge2.0-0 \

    libcups2 \    libcups2 \

    libdbus-1-3 \    libdbus-1-3 \

    libdrm2 \    libdrm2 \

    libgbm1 \    libgbm1 \

    libnspr4 \    libnspr4 \

    libnss3 \    libnss3 \

    libx11-xcb1 \    libx11-xcb1 \

    libxcomposite1 \    libxcomposite1 \

    libxdamage1 \    libxdamage1 \

    libxfixes3 \    libxfixes3 \

    libxrandr2 \    libxrandr2 \

    xdg-utils \    xdg-utils \

 && rm -rf /var/lib/apt/lists/* && rm -rf /var/lib/apt/lists/*



# Copy server package files and install dependencies# Copy server package files and install dependencies

COPY server/package*.json ./COPY server/package*.json ./

RUN npm installRUN npm install



# Copy the rest of the server files# Copy the rest of the server files

COPY server/ .COPY server .



# Generate Prisma client (only if schema exists)# Generate Prisma client (only if schema exists)

RUN [ -f prisma/schema.prisma ] && npx prisma generate || echo "No Prisma schema found"RUN [ -f prisma/schema.prisma ] && npx prisma generate || echo "No Prisma schema found"



# Expose your app's port# Expose your app's port

EXPOSE 5000EXPOSE 5000



# Start the server# Start the server

CMD ["npm", "start"]CMD ["npm", "start"]