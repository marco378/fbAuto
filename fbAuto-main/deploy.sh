#!/bin/bash

echo "🚀 FbAuto Deployment Script"
echo "=========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the fbAuto-main directory"
    exit 1
fi

# Configure git for this project
echo "🔧 Configuring Git..."
git config user.name "marcosclark71"
git config user.email "marcosclark71@gmail.com"

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
fi

# Add all files
echo "📁 Adding files..."
git add .

# Commit changes
echo "💾 Committing changes..."
git commit -m "Production ready: Facebook Job Posting Automation System"

echo "✅ Repository prepared!"
echo ""
echo "📋 Next steps:"
echo "1. Create new repository on GitHub (marcosclark71@gmail.com)"
echo "2. Run: git remote add origin https://github.com/marcosclark71/YOUR_REPO_NAME.git"
echo "3. Run: git push -u origin main"
echo "4. Deploy to Railway: https://railway.app"
echo ""
echo "📄 See GITHUB_SETUP.md for detailed instructions"