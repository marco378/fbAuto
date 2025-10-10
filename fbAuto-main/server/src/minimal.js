// Minimal server for testing Railway deployment
import express from 'express'
import cors from 'cors'
import { PORT } from './credentials.js';

const app = express()

// Environment check
console.log('Minimal server starting...');
console.log('- PORT:', PORT);
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');

app.use(cors({
  origin: "*", // Allow all origins for testing
  credentials: true
}));

app.use(express.json())

app.get("/health", (req, res) => {
  console.log('Health check requested');
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    server: "minimal"
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "FB Auto Server is running",
    status: "ok"
  });
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

console.log('✅ Minimal server setup complete');