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
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

/**
 * A single byte range, or null when the request did not ask for one. The
 * `bytes=-N` suffix form is legal too, so an empty start means "last N bytes".
 */
function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header ?? '');
  if (!match) return null;
  const [, rawStart, rawEnd] = match;
  if (rawStart === '' && rawEnd === '') return null;
  if (rawStart === '') {
    const length = Number(rawEnd);
    return { start: Math.max(0, size - length), end: size - 1 };
  }
  const start = Number(rawStart);
  const end = rawEnd === '' ? size - 1 : Math.min(Number(rawEnd), size - 1);
  return { start, end };
}

createServer(async (req, res) => {
  const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0]);
  const target = normalize(join(ROOT, urlPath === '/' ? '/index.html' : urlPath));
  if (!target.startsWith(ROOT)) {
    res.writeHead(403).end('forbidden');
    return;
  }

  let body;
  try {
    body = await readFile(target);
  } catch {
    res.writeHead(404).end(`not found: ${urlPath}`);
    return;
  }

  res.setHeader('content-type', MIME[extname(target)] ?? 'application/octet-stream');
  // The hero video needs Range support: without it the browser cannot seek, and
  // Safari refuses to play a media file whose server does not advertise it.
  res.setHeader('accept-ranges', 'bytes');

  const range = parseRange(req.headers.range, body.length);
  if (range && range.start <= range.end) {
    res.writeHead(206, {
      'content-range': `bytes ${range.start}-${range.end}/${body.length}`,
      'content-length': range.end - range.start + 1,
    });
    res.end(body.subarray(range.start, range.end + 1));
    return;
  }
  if (range) {
    res.writeHead(416, { 'content-range': `bytes */${body.length}` }).end();
    return;
  }

  res.writeHead(200, { 'content-length': body.length }).end(body);
}).listen(PORT, '127.0.0.1', () => {
  console.log(`TabPeek landing: http://127.0.0.1:${PORT}/`);
});
