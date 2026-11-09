import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json' };
const root = new URL('../dist/', import.meta.url);
const port = Number(process.env.PORT || 4173);

createServer(async (request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname;
  try {
    const file = new URL('.' + (path === '/admin' ? '/admin/index.html' : path.endsWith('/') ? path + 'index.html' : path), root);
    if (!file.href.startsWith(root.href)) throw new Error('Invalid path');
    const content = await readFile(file);
    response.writeHead(200, { 'Content-Type': types[extname(file.pathname)] || 'application/octet-stream' });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`Preview at http://127.0.0.1:${port}`));
