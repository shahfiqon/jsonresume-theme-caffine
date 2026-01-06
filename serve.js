const http = require('http');
const fs = require('fs');
const theme = require('./index');

const PORT = 4000;

// Read resume data
const resume = JSON.parse(fs.readFileSync('./resume.json', 'utf-8'));

// Render HTML
const html = theme.render(resume);

// Create server
const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Cache-Control': 'no-cache'
  });
  res.end(html);
});

server.listen(PORT, () => {
  console.log('\n✅ Resume server started successfully!');
  console.log(`\n📄 Preview: http://localhost:${PORT}`);
  console.log('\n⌨️  Press Ctrl+C to stop\n');
});

// Handle errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use.`);
    console.error('   Please stop the other server or use a different port.\n');
  } else {
    console.error('\n❌ Server error:', err.message, '\n');
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down server...\n');
  server.close(() => {
    process.exit(0);
  });
});

