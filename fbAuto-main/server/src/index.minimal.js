// Minimal server for Railway deployment testing
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()
const PORT = parseInt(process.env.PORT, 10) || 5000

console.log('Starting minimal server...');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Port:', PORT);
console.log('Database URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');

app.use((req, res, next) => {
  console.log(`Request Method: ${req.method}, Request URL: ${req.url}`);
  next();
});

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://fb-auto-phi.vercel.app"
    ],
    credentials: true,
  })
);

app.use(cookieParser())
app.use(express.json())

// Simple health check
app.get("/health", (req, res) => {
  try {
    console.log('Health check requested');
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      database: process.env.DATABASE_URL ? "configured" : "not configured",
      port: PORT,
      version: "minimal"
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

// Simple test endpoint
app.get("/", (req, res) => {
  res.json({
    message: "FB Auto Server - Minimal Version",
    status: "running",
    timestamp: new Date().toISOString()
  })
})

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    status: "error",
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Start server
function startServer() {
  try {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Minimal server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log('Server startup completed successfully');
    });
    
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

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer();