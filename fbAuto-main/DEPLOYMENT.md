# Deploy to Railway

## Quick Setup:
1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project from GitHub repo
4. Add environment variables
5. Deploy

## Environment Variables to add in Railway:
```
DATABASE_URL=postgresql://neondb_owner:npg_aAntD3j1YCGh@ep-cool-meadow-adpg4rse-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
FACEBOOK_EMAIL=airecuritement@gmail.com
FACEBOOK_PASSWORD=Varunsh@123
FACEBOOK_VERIFY_TOKEN=n8n-auto-messanger
N8N_WEBHOOK_URL=https://audace.app.n8n.cloud/webhook/webhook-test
N8N_JOB_CONTEXT_WEBHOOK_URL=https://audace.app.n8n.cloud/webhook/webhook-test
NODE_ENV=production
JWT_SECRET=hrdashboard
PORT=5000
DOMAIN_URL=${{RAILWAY_STATIC_URL}}
HEADLESS=true
DEBUG=false
SLOWMO=0
```

## Your app will be available at:
`https://your-app-name.up.railway.app`