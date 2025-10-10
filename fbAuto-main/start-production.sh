#!/bin/bash

echo "🚀 Starting fbAuto production server..."

# Change to server directory
cd /app/server

# Generate Prisma client (ensure it's fresh)
echo "📦 Generating Prisma client..."
npx prisma generate

# Run database migrations if needed
echo "🗄️ Running database migrations..."
npx prisma migrate deploy || echo "⚠️ No migrations to run"

# Start the server
echo "🌟 Starting server..."
node src/index.js