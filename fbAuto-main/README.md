# 🤖 FbAuto - Automated Facebook Job Posting System

A comprehensive automation system for posting jobs to Facebook groups and managing candidate applications through an integrated workflow.

## ✨ Features

- 🎯 **Automated Job Posting** - Posts jobs to multiple Facebook groups
- 💬 **Smart Engagement** - Automatically engages with posts for better reach
- 📱 **Messenger Integration** - Direct candidate application via Messenger links
- 🔄 **n8n Workflow** - Automated candidate processing and management
- 📊 **Dashboard** - Web interface for job and candidate management
- 🗄️ **Database Integration** - PostgreSQL with Prisma ORM
- 🚀 **Production Ready** - Dockerized and cloud deployment ready

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   (Next.js)     │───▶│   (Node.js)     │───▶│  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                               ▼
                       ┌─────────────────┐
                       │   Automation    │
                       │  (Playwright)   │
                       └─────────────────┘
                               │
                               ▼
                       ┌─────────────────┐
                       │   n8n Workflow │
                       │   Integration   │
                       └─────────────────┘
```

## 🚀 Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/deploy)

1. Click the deploy button above
2. Connect your GitHub account
3. Set environment variables (see below)
4. Deploy!

## 🔧 Environment Variables

Copy `.env.production` and update these variables in Railway:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# Facebook Credentials
FACEBOOK_EMAIL=your_facebook_email
FACEBOOK_PASSWORD=your_facebook_password
FACEBOOK_VERIFY_TOKEN=your_webhook_verify_token

# n8n Integration
N8N_WEBHOOK_URL=your_n8n_webhook_url
N8N_JOB_CONTEXT_WEBHOOK_URL=your_n8n_job_context_url

# Production Settings
NODE_ENV=production
HEADLESS=true
DEBUG=false
DOMAIN_URL=${{RAILWAY_STATIC_URL}}
```

## 🏃‍♂️ Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/fbauto.git
cd fbauto

# Install dependencies
npm install
cd server && npm install

# Set up environment
cp .env.production .env
# Edit .env with your local settings

# Generate Prisma client
npx prisma generate --schema=server/prisma/schema.prisma

# Run database migrations
cd server && npx prisma db push

# Start the application
npm run dev
```

## 📱 Frontend Development

```bash
cd fbAutoClient-main
npm install
npm run dev
```

Frontend will be available at `http://localhost:3000`

## 🔄 How It Works

1. **Job Creation** - Create jobs through the web interface
2. **Automatic Posting** - System posts to Facebook groups every minute (configurable)
3. **Candidate Engagement** - Messenger links embedded in posts
4. **n8n Processing** - Candidates processed through automated workflows
5. **Database Storage** - All data stored and tracked in PostgreSQL

## 📊 API Endpoints

- `GET /api/automation/status` - Check automation status
- `POST /api/automation/process-all-jobs` - Manually trigger job processing
- `GET /webhook/messenger` - Facebook Messenger webhook
- `GET /api/messenger-redirect` - Candidate application redirect

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js, Prisma ORM
- **Frontend**: Next.js, React, Tailwind CSS
- **Database**: PostgreSQL (Neon)
- **Automation**: Playwright, Node-cron
- **Integration**: n8n workflows
- **Deployment**: Docker, Railway/Google Cloud Run

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For support, open an issue or contact the development team.# fbAuto
