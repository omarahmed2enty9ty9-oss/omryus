/**
 * Dead-simple static server for the test fixtures. Node standard library only.
 *   npm run mock  ->  http://localhost:8642
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };

const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const file = join(root, normalize(path === '/' ? '/index.html' : path).replace(/^(\.\.[/\\])+/, ''));
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'text/plain' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  }
});

server.on('error', (error) => {
  if (error.code !== 'EADDRINUSE') throw error;
  console.error('Port 8642 is already in use — the mock store is probably already running.\n' +
    'Open http://localhost:8642, or stop the other one with:  pkill -f mock-store/server.js');
  process.exit(1);
});

server.listen(8642, () => console.log('Mock Store on http://localhost:8642'));
