// Zero-dependency static server for local preview of the landing site.
// Usage: pnpm landing:tabpeek   (or PORT=8080 node scripts/serve.mjs)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PORT = Number(process.env.PORT ?? 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

createServer(async (req, res) => {
  const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const target = normalize(join(ROOT, urlPath === '/' ? '/index.html' : urlPath));
  if (!target.startsWith(ROOT)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    const body = await readFile(target);
    res
      .writeHead(200, { 'content-type': MIME[extname(target)] ?? 'application/octet-stream' })
      .end(body);
  } catch {
    res.writeHead(404).end(`not found: ${urlPath}`);
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`TabPeek landing: http://127.0.0.1:${PORT}/`);
});
