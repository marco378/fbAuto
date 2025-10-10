// src/server.js (optimized version with better process management)
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { PORT } from './credentials.js';
import router from './routes/index.js';
import { automationService } from './services/automation.services.js';
import { commentScheduler } from './services/comment-scheduler.js';
import { jobPostScheduler } from './services/job-post-scheduler.js';
import { messengerRedirectWithContext } from './routes/messanger-redirect.js';
import contextRouter from './routes/job-context.js';
import { handleMessengerWebhook } from './controllers/messanger-webhook.js';

const app = express()

// Track server state
let server = null;
let isShuttingDown = false;

app.use((req, res, next) => {
  console.log(`Request Method: ${req.method}, Request URL: ${req.url}`);
  next();
});

app.use(
  cors({
    origin: [
      "http://localhost:3000",             // local dev
      "https://fb-auto-client.vercel.app", // old deployed frontend
      "https://fb-auto-phi.vercel.app"     // new deployed frontend
    ],
    credentials: true, // IMPORTANT: allow cookies
  })
);
app.use(cookieParser())
app.use(express.json())

app.get("/health", (req, res) => {
  try {
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      database: process.env.DATABASE_URL ? "configured" : "not configured",
      port: PORT
    })
  } catch (error) {
    console.error("Health check error:", error);
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
})

// Enhanced automation status endpoint with system stats
app.get("/api/automation/status", async (req, res) => {
  try {
    const serviceStatus = automationService.getServiceStatus();
    const systemStats = await automationService.getSystemStats();
    
    res.json({
      ...serviceStatus,
      systemStats,
      optimizations: {
        approach: "Immediate self-reply after job posting",
        benefits: [
          "Reduced browser instances (60% less resource usage)",
          "Immediate candidate engagement (0 delay vs 30min)",
          "Simplified automation logic",
          "Better user experience"
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get automation status",
      message: error.message
    });
  }
});

// Manual comment monitoring endpoint (for edge cases)
app.post("/api/automation/manual-comment-monitoring/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`Manual comment monitoring requested for user: ${userId}`);
    
    const result = await automationService.runManualCommentMonitoring(userId);
    
    res.json({
      success: true,
      message: "Manual comment monitoring completed",
      result
    });
    
  } catch (error) {
    console.error(`Manual comment monitoring failed:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Enhanced job posting endpoint
app.post("/api/automation/job-post/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { jobId } = req.body;
    
    console.log(`Job posting requested for user: ${userId}, job: ${jobId || 'latest'}`);
    
    const result = await automationService.runJobPostAutomationForUser(userId, jobId);
    
    res.json({
      success: true,
      message: "Job posting with immediate engagement completed",
      result
    });
    
  } catch (error) {
    console.error(`Job posting failed:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manual job processing endpoint (for testing)
app.post("/api/automation/process-all-jobs", async (req, res) => {
  try {
    console.log(`Manual job processing requested`);
    
    const result = await automationService.processAllPendingJobs();
    
    res.json({
      success: true,
      message: "Manual job processing completed",
      result
    });
    
  } catch (error) {
    console.error(`Manual job processing failed:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.use("/api", router)
app.use("/api", contextRouter)
app.get('/api/messenger-redirect', messengerRedirectWithContext);

// Facebook Messenger webhook
app.get('/webhook/messenger', handleMessengerWebhook);  // For verification
app.post('/webhook/messenger', handleMessengerWebhook); // For receiving events

async function startServer() {
  try {
    console.log('Starting optimized server...');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Port:', PORT);
    console.log('Database URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
    
    // Test database connection if configured
    if (process.env.DATABASE_URL) {
      try {
        console.log('Testing database connection...');
        // Import prisma client here to avoid errors if database is not configured
        const { PrismaClient } = await import('../lib/prisma.js');
        const prisma = new PrismaClient();
        await prisma.$connect();
        console.log('Database connection successful');
        await prisma.$disconnect();
      } catch (dbError) {
        console.warn('Database connection failed:', dbError.message);
        console.warn('Continuing without database...');
      }
    } else {
      console.warn('No DATABASE_URL configured, skipping database setup');
    }
    
    // Initialize services with error handling
    try {
      await automationService.initialize();
      console.log('Automation service initialized');
    } catch (error) {
      console.warn('Automation service initialization failed:', error.message);
    }
    
    try {
      await commentScheduler.initialize();
      console.log('Comment scheduler initialized');
    } catch (error) {
      console.warn('Comment scheduler initialization failed:', error.message);
    }
    
    try {
      await jobPostScheduler.initialize();
      console.log('Job post scheduler initialized');
    } catch (error) {
      console.warn('Job post scheduler initialization failed:', error.message);
    }
    
    // Start the server
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Automation status: http://localhost:${PORT}/api/automation/status`);
      console.log('Server startup completed successfully');
    });
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Enhanced graceful shutdown
async function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log('Already shutting down...');
    return;
  }
  
  isShuttingDown = true;
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  
  try {
    // Stop accepting new connections
    if (server) {
      server.close(() => {
        console.log('HTTP server closed');
      });
    }
    
    // Shutdown automation service (this will close browsers)
    await automationService.shutdown();
    
    // Shutdown comment scheduler
    await commentScheduler.shutdown();
    
    // Shutdown job post scheduler
    await jobPostScheduler.shutdown();
    
    console.log('Graceful shutdown completed');
    process.exit(0);
    
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();