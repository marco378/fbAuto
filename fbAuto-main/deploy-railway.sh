#!/bin/bash

echo "🚀 Deploying to Railway..."

# Add all changes
git add .

# Commit changes
git commit -m "Deploy to Railway: $(date)"

# Push to trigger Railway deployment
git push

echo "✅ Code pushed to GitHub"
echo "🔄 Railway will automatically deploy your changes"
echo "📊 Check your Railway dashboard for deployment status"
echo "🌐 Your app will be available at: https://fbauto-production.up.railway.app"

echo ""
echo "⚠️  Make sure these environment variables are set in Railway:"
echo "   - DATABASE_URL"
echo "   - JWT_SECRET"
echo "   - NODE_ENV=production"
echo "   - FACEBOOK_EMAIL"
echo "   - FACEBOOK_PASSWORD"
echo ""
echo "🔍 Monitor deployment at: https://railway.app"