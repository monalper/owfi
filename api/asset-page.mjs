import {
  buildAssetMeta,
  patchHtmlWithMeta,
  DEFAULT_PAGE_TITLE,
  DEFAULT_DESCRIPTION,
} from './meta-utils.mjs';

export default async function handler(req, res) {
  try {
    const symbolParam =
      (req.query && (req.query.symbol || req.query.s)) || '';

    const symbol = Array.isArray(symbolParam)
      ? symbolParam[0]
      : symbolParam;

    const host = req.headers.host || 'localhost:3000';
    const isLocalhost =
      host.startsWith('localhost') || host.startsWith('127.0.0.1');
    const protocol = isLocalhost ? 'http' : 'https';

    const baseUrl = `${protocol}://${host}/`;

    const baseResponse = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!baseResponse.ok) {
      throw new Error(`Base HTML fetch failed with status ${baseResponse.status}`);
    }

    const baseHtml = await baseResponse.text();

    let meta = {
      title: DEFAULT_PAGE_TITLE,
      description: DEFAULT_DESCRIPTION,
      image: undefined,
    };

    if (symbol) {
      const baseMeta = await buildAssetMeta(symbol);

      const ogImageUrl = `${protocol}://${host}/api/asset-og?symbol=${encodeURIComponent(
        symbol,
      )}`;

      meta = {
        ...baseMeta,
        image: ogImageUrl,
      };
    }

    const html = patchHtmlWithMeta(baseHtml, meta);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('asset-page handler error', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Internal Server Error');
  }
}
