#!/bin/bash

echo "🚀 Deploying Frontend to Vercel..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the frontend directory."
    exit 1
fi

# Add all changes
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️ No changes to commit"
else
    # Commit changes
    git commit -m "Deploy frontend: $(date)"
    echo "✅ Changes committed"
fi

# Push to trigger Vercel deployment
git push

echo "✅ Code pushed to GitHub"
echo "🔄 Vercel will automatically deploy your changes"
echo "🌐 Your frontend will be available at: https://fb-auto-phi.vercel.app"
echo ""
echo "📋 Make sure your Vercel project is connected to this GitHub repository"
echo "🔍 Monitor deployment at: https://vercel.com/dashboard"