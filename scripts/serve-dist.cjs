const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.usdz': 'model/vnd.usdz+zip' };
http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const candidate = path.resolve(root, '.' + pathname);
  const safePath = candidate.startsWith(root + path.sep) || candidate === root ? candidate : path.join(root, 'index.html');
  const file = fs.existsSync(safePath) && fs.statSync(safePath).isFile() ? safePath : path.join(root, 'index.html');
  response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(response);
}).listen(8082, '127.0.0.1', () => console.log('Production preview: http://127.0.0.1:8082'));
