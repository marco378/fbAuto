const http = require('http');

const PORT = process.env.PORT || 5000;

console.log('Starting absolute minimal server...');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  
  if (req.url === '/health') {
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: PORT
    }));
  } else {
    res.end(JSON.stringify({
      message: 'Absolute minimal server',
      status: 'running'
    }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Absolute minimal server listening on 0.0.0.0:${PORT}`);
  console.log('Server started successfully!');
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});