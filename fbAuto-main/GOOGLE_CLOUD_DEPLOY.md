# Deploy to Google Cloud Run

## Prerequisites:
1. Install Google Cloud CLI: `gcloud auth login`
2. Create project: `gcloud projects create your-project-id`
3. Enable Cloud Run: `gcloud services enable run.googleapis.com`

## Build and Deploy:
```bash
# Build the Docker image
docker build -t gcr.io/your-project-id/fbauto .

# Push to Google Container Registry
docker push gcr.io/your-project-id/fbauto

# Deploy to Cloud Run
gcloud run deploy fbauto \
  --image gcr.io/your-project-id/fbauto \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --port 5000 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production,HEADLESS=true,DEBUG=false,SLOWMO=0
```

## Your app will be available at:
`https://fbauto-[hash].europe-west1.run.app`