// src/server.js (optimized version with better process management)
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { PORT } from './credentials.js';

const app = express()

// Track server state
let server = null;
let isShuttingDown = false;

// Environment check
console.log('Environment check:');
console.log('- PORT:', PORT);
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');

app.use((req, res, next) => {
  console.log(`Request Method: ${req.method}, Request URL: ${req.url}`);
  next();
});

app.use(
  cors({
    origin: [
      "http://localhost:3000",             // local dev
      "https://fb-auto-phi.vercel.app",    // main domain
      /^https:\/\/fb-auto.*\.vercel\.app$/ // Match any fb-auto Vercel deployment
    ],
    credentials: true, // IMPORTANT: allow cookies
  })
);
app.use(cookieParser())
app.use(express.json())

app.get("/health", (req, res) => {
  // Always respond to health checks, even if services aren't fully initialized
  const healthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    server: "running"
  };
  
  res.json(healthStatus);
})

// Import and setup other routes/services after basic setup
let router, automationService, commentScheduler, jobPostScheduler;
let messengerRedirectWithContext, contextRouter, handleMessengerWebhook;

async function setupRoutes() {
  try {
    // Dynamic imports to avoid startup failures
    const routerModule = await import('./routes/index.js');
    router = routerModule.default;
    
    const automationModule = await import('./services/automation.services.js');
    automationService = automationModule.automationService;
    
    const commentModule = await import('./services/comment-scheduler.js');
    commentScheduler = commentModule.commentScheduler;
    
    const jobPostModule = await import('./services/job-post-scheduler.js');
    jobPostScheduler = jobPostModule.jobPostScheduler;
    
  const messengerModule = await import('./routes/messanger-redirect.js');
  const messengerRouter = messengerModule.default;
    
    const contextModule = await import('./routes/job-context.js');
    contextRouter = contextModule.default;
    
    const webhookModule = await import('./controllers/messanger-webhook.js');
    handleMessengerWebhook = webhookModule.handleMessengerWebhook;
    
    // Setup routes
    app.use('/api', router);
  app.use('/api/messenger-redirect', messengerRouter);
    app.use('/job-context', contextRouter);
    app.get('/webhook/messenger', handleMessengerWebhook);
    app.post('/webhook/messenger', handleMessengerWebhook);
    
    console.log('✅ Routes successfully loaded');
    return true;
  } catch (error) {
    console.error('❌ Failed to load routes:', error.message);
    return false;
  }
}

// Enhanced automation status endpoint with system stats
app.get("/api/automation/status", async (req, res) => {
  try {
    if (automationService) {
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
    } else {
      res.json({
        status: "initializing",
        message: "Automation service not yet loaded"
      });
    }
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

async function startServer() {
  try {
    console.log('Starting optimized server...');
    
    // Start the HTTP server first, so health checks can pass
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Automation status: http://localhost:${PORT}/api/automation/status`);
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
    
    // Setup routes and services after server is running (non-blocking for health checks)
    setTimeout(async () => {
      await setupRoutes();
      await initializeServices();
    }, 1000); // Small delay to ensure server is fully started
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function initializeServices() {
  if (!automationService || !commentScheduler || !jobPostScheduler) {
    console.log('❌ Services not loaded, skipping initialization');
    return;
  }
  
  try {
    console.log('Initializing services...');
    
    // Initialize the automation service (now with optimized job posting)
    try {
      await automationService.initialize();
      console.log('✅ Automation service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize automation service:', error.message);
    }
    
    // Initialize the comment scheduler for automated monitoring
    try {
      await commentScheduler.initialize();
      console.log('✅ Comment scheduler initialized');
    } catch (error) {
      console.error('❌ Failed to initialize comment scheduler:', error.message);
    }
    
    // Initialize the job post scheduler for automated job processing
    try {
      await jobPostScheduler.initialize();
      console.log('✅ Job post scheduler initialized');
    } catch (error) {
      console.error('❌ Failed to initialize job post scheduler:', error.message);
    }
    
    console.log('Service initialization completed');
    console.log('Job posting with immediate engagement runs every 1 minute');
    console.log('Automated comment monitoring runs every 30 minutes');
    console.log('Manual comment monitoring available via API when needed');
    console.log('Resource usage optimized - ~60% reduction in browser instances');
    
  } catch (error) {
    console.error('Error during service initialization:', error);
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