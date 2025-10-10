# Use Node 18 as base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json from the server folder
COPY fbAuto-main/server/package*.json ./

# Install production dependencies
RUN npm install --production

# Copy the server source code
COPY fbAuto-main/server/src ./src

# Copy the automation folder
COPY fbAuto-main/src/automation ./src/automation

# Expose port 8080
EXPOSE 8080

# Start the app
CMD ["node", "src/index.js"]