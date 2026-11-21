// A tiny static server for app/ (Node 22, standard library only), so the
// guide can be tried locally without a build step:
//
//   node serve.ts            # serves app/ on http://localhost:8080
//   node serve.ts --port 9000
//
// It sends the MIME types a browser needs and refuses any path outside
// app/. A development convenience only, not a server for the internet.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const argv = process.argv.slice(2);
const portFlag = argv.indexOf('--port');
const wanted = portFlag === -1 ? 8080 : Number(argv[portFlag + 1]);
const port = Number.isInteger(wanted) && wanted > 0 && wanted < 65536 ? wanted : 8080;

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

const server = createServer(async (request, response) => {
  try {
    let pathname = '/';
    try {
      pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    } catch {
      response.writeHead(400);
      response.end('bad request');
      return;
    }
    if (pathname === '/') pathname = '/index.html';
    const file = resolve(join(appRoot, normalize(pathname)));
    if (file !== appRoot && !file.startsWith(appRoot + sep)) {
      response.writeHead(403);
      response.end('forbidden');
      return;
    }
    const body = await readFile(file);
    response.writeHead(200, {
      'content-type': MIME_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'content-length': body.length,
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('not found');
  }
});

server.listen(port, () => {
  console.log(`gta6-trophy-guide-01: serving app/ on http://localhost:${port}/`);
});
