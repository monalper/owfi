import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PRESET_LISTS } from './src/config/lists.js';

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

const DEFAULT_PAGE_TITLE = 'Openwall Finance | Piyasalar';
const DEFAULT_DESCRIPTION =
  "Piyasaları Openwall Finance'dan takip edin.";

function isBotRequest(req) {
  const ua = String(req.headers['user-agent'] || '').toLowerCase();

  if (!ua) return false;

  return (
    ua.includes('whatsapp') ||
    ua.includes('facebookexternalhit') ||
    ua.includes('twitterbot') ||
    ua.includes('telegram') ||
    ua.includes('discordbot') ||
    ua.includes('linkedinbot') ||
    ua.includes('slackbot') ||
    ua.includes('vkshare') ||
    ua.includes('okhttp') // bazı mobil paylaşımlar
  );
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function normalizeAssetSymbol(symbol) {
  const upper = String(symbol || '').toUpperCase();

  if (!upper) return '';
  if (upper === 'XAUUSD=X') return 'Altın';
  if (upper === 'XAGUSD=X') return 'Gümüş';

  if (upper.endsWith('.IS')) {
    return upper.replace(/\.IS$/i, '');
  }

  return upper;
}

async function buildAssetMeta(urlPath) {
  const rawSymbolPart = urlPath.slice('/asset/'.length).replace(/^\/+/, '');
  const symbolPart = decodeURIComponent(rawSymbolPart || '');

  if (!symbolPart) {
    return {
      title: DEFAULT_PAGE_TITLE,
      description: DEFAULT_DESCRIPTION,
    };
  }

  const symbol = symbolPart;
  let displayName = normalizeAssetSymbol(symbol);

  try {
    const targetUrl = `${YAHOO_TARGET}/v8/finance/chart/${encodeURIComponent(
      symbol,
    )}?range=1d&interval=1d&lang=tr-TR&region=TR`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json, text/plain, */*',
      },
    });

    if (response.ok) {
      const json = await response.json();
      const meta = json?.chart?.result?.[0]?.meta || {};
      const longName = meta.longName;
      const shortName = meta.shortName;

      if (longName || shortName) {
        displayName = longName || shortName;
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Asset meta fetch error (server.mjs)', symbol, error);
  }

  const name = displayName || symbol;
  const title = `${name} | Openwall Finance`;
  const description = `${name} için fiyat, grafik ve özet piyasa verileri. Piyasaları Openwall Finance'dan takip edin.`;

  return { title, description };
}

function buildListMeta(urlPath) {
  const rawIdPart = urlPath.slice('/lists/'.length).replace(/^\/+/, '');
  const listId = decodeURIComponent(rawIdPart || '');

  if (!listId) {
    return {
      title: 'Listeler | Openwall Finance',
      description: DEFAULT_DESCRIPTION,
    };
  }

  const list = PRESET_LISTS.find((item) => item.id === listId);

  if (!list) {
    return {
      title: 'Listeler | Openwall Finance',
      description: DEFAULT_DESCRIPTION,
    };
  }

  const title = `${list.title} | Openwall Finance`;
  const description = `${list.title} listesindeki seçili varlıklar ve piyasa verileri. Piyasaları Openwall Finance'dan takip edin.`;

  return { title, description };
}

async function renderIndexWithMeta({
  filePath,
  res,
  urlPath,
}) {
  try {
    const baseHtml = await fs.promises.readFile(filePath, 'utf8');

    let meta = {
      title: DEFAULT_PAGE_TITLE,
      description: DEFAULT_DESCRIPTION,
    };

    if (urlPath.startsWith('/asset/')) {
      meta = await buildAssetMeta(urlPath);
    } else if (urlPath.startsWith('/lists/')) {
      meta = buildListMeta(urlPath);
    }

    const title = meta.title || DEFAULT_PAGE_TITLE;
    const description = meta.description || DEFAULT_DESCRIPTION;

    let html = baseHtml;

    html = html.replace(
      /<title>.*?<\/title>/i,
      `<title>${escapeHtml(title)}</title>`,
    );

    html = html.replace(
      /<meta\s+property=["']og:title["'][^>]*>/i,
      `<meta property="og:title" content="${escapeAttr(title)}" />`,
    );

    html = html.replace(
      /<meta\s+name=["']twitter:title["'][^>]*>/i,
      `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    );

    html = html.replace(
      /<meta\s+property=["']og:description["'][^>]*>/i,
      `<meta property="og:description" content="${escapeAttr(
        description,
      )}" />`,
    );

    html = html.replace(
      /<meta\s+name=["']twitter:description["'][^>]*>/i,
      `<meta name="twitter:description" content="${escapeAttr(
        description,
      )}" />`,
    );

    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end(html);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Bot HTML render error (server.mjs)', error);

    fs.createReadStream(filePath)
      .on('error', () => {
        res.statusCode = 500;
        res.end('Error reading file');
      })
      .pipe(res);
  }
}

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
    const isHtml = ext === '.html';

    if (mime) {
      res.setHeader('content-type', mime);
    }

    const isBot = isBotRequest(req);
    const isAssetDetail = urlWithoutQuery.startsWith('/asset/');
    const isListDetail = urlWithoutQuery.startsWith('/lists/');

    if (isHtml && isBot && (isAssetDetail || isListDetail)) {
      renderIndexWithMeta({
        filePath,
        res,
        urlPath: urlWithoutQuery,
      });
      return;
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
