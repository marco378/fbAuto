# GitHub Setup Guide for Different Account

## Step 1: Configure Git for This Project
Run these commands in your terminal:

```bash
cd "/Users/noir/Desktop/fbAuto 2/fbAuto-main"

# Configure git for this specific repository
git config user.name "marcosclark71"
git config user.email "marcosclark71@gmail.com"

# Initialize git repository
git init

# Add all files
git add .

# Make initial commit
git commit -m "Initial commit: Facebook Job Posting Automation System"
```

## Step 2: Create New Repository on GitHub

1. Go to https://github.com
2. Sign in with: marcosclark71@gmail.com / SrkVgZ@hVLwV5La
3. Click "New repository" (green button)
4. Name it: `fbauto` or `facebook-job-automation`
5. Description: `Automated Facebook Job Posting System`
6. Make it Public or Private (your choice)
7. DON'T initialize with README (we already have one)
8. Click "Create repository"

## Step 3: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add the remote repository
git remote add origin https://github.com/marcosclark71/your-repo-name.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Authentication

When prompted for credentials:
- Username: marcosclark71
- Password: Use a Personal Access Token (not the account password)

### To create a Personal Access Token:
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token"
3. Give it a name: "FbAuto Deployment"
4. Select scopes: repo, workflow
5. Copy the token and use it as password when pushing

## Step 5: Deploy to Railway

1. Go to https://railway.app
2. Sign in with GitHub (using marcosclark71@gmail.com account)
3. Create new project from GitHub repository
4. Select your newly created repository
5. Add environment variables (see DEPLOYMENT.md)
6. Deploy!

Your app will be live at: https://your-app-name.up.railway.app