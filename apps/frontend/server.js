const http = require('http');
const path = require('path');
const next = require('next');

const port = 3000;
const hostname = '127.0.0.1';
const appDir = path.resolve(__dirname);

console.log('App dir:', appDir);
const app = next({ dev: false, dir: appDir });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  server.listen(port, hostname, (err) => {
    if (err) {
      console.error('Server listen error:', err);
      process.exit(1);
    }
    console.log(`> Frontend server running on http://${hostname}:${port}`);
  });
}).catch((err) => {
  console.error('Error starting Next.js:', err);
  process.exit(1);
});
