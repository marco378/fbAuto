// Ultra minimal server for Railway deployment testing
const express = require('express');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('Starting ultra minimal server...');
console.log('Port:', PORT);

app.use(express.json());

// Simple health check
app.get("/health", (req, res) => {
  console.log('Health check requested');
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    port: PORT,
    version: "ultra-minimal"
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "FB Auto Server - Ultra Minimal",
    status: "running"
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ultra minimal server running on port ${PORT}`);
  console.log('Server started successfully');
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  process.exit(0);
});