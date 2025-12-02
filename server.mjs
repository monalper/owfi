import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, 'dist');
const YAHOO_TARGET = 'https://query1.finance.yahoo.com';
const PORT = process.env.PORT || 4173;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

async function handleYahooProxy(req, res) {
  const url = req.url || '/';
  const upstreamPath = url.replace(/^\/api\/yahoo/, '') || '/';
  const targetUrl = `${YAHOO_TARGET}${upstreamPath}`;

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json, text/plain, */*',
      },
    });

    res.statusCode = upstreamResponse.status;

    upstreamResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'content-length') return;
      res.setHeader(key, value);
    });

    const text = await upstreamResponse.text();
    res.end(text);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Yahoo proxy error (server.mjs)', error);
    res.statusCode = 500;
    res.end('Yahoo proxy error');
  }
}

function serveStatic(req, res) {
  const rawUrl = req.url || '/';
  const urlWithoutQuery = rawUrl.split('?')[0];

  let filePath = path.join(DIST_DIR, urlWithoutQuery);

  if (urlWithoutQuery === '/' || !path.extname(urlWithoutQuery)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // SPA fallback: unknown paths render index.html
      const fallback = path.join(DIST_DIR, 'index.html');
      fs.stat(fallback, (fallbackErr, fallbackStats) => {
        if (fallbackErr || !fallbackStats.isFile()) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }

        res.setHeader('content-type', 'text/html; charset=utf-8');
        fs.createReadStream(fallback)
          .on('error', () => {
            res.statusCode = 500;
            res.end('Error reading file');
          })
          .pipe(res);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext];
    if (mime) {
      res.setHeader('content-type', mime);
    }

    fs.createReadStream(filePath)
      .on('error', () => {
        res.statusCode = 500;
        res.end('Error reading file');
      })
      .pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const url = req.url || '/';

  if (url.startsWith('/api/yahoo')) {
    handleYahooProxy(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});

