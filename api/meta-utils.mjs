const DEFAULT_PAGE_TITLE = 'Openwall Finance | Piyasalar';
const DEFAULT_DESCRIPTION =
  "Piyasaları Openwall Finance'den takip edin.";

const YAHOO_TARGET = 'https://query1.finance.yahoo.com';

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

async function buildAssetMeta(symbol) {
  if (!symbol) {
    return {
      title: DEFAULT_PAGE_TITLE,
      description: DEFAULT_DESCRIPTION,
    };
  }

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
    console.error('Asset meta fetch error (api/meta-utils.mjs)', symbol, error);
  }

  const name = displayName || symbol;
  const title = `${name} | Openwall Finance`;
  const description = `${name} için fiyat, grafik ve özet piyasa verileri. Piyasaları Openwall Finance'den takip edin.`;

  return { title, description };
}

function patchHtmlWithMeta(html, { title, description, image }) {
  const safeTitle = title || DEFAULT_PAGE_TITLE;
  const safeDescription = description || DEFAULT_DESCRIPTION;

  let nextHtml = html;

  nextHtml = nextHtml.replace(
    /<title>.*?<\/title>/i,
    `<title>${escapeHtml(safeTitle)}</title>`,
  );

  nextHtml = nextHtml.replace(
    /<meta\s+property=["']og:title["'][^>]*>/i,
    `<meta property="og:title" content="${escapeAttr(safeTitle)}" />`,
  );

  nextHtml = nextHtml.replace(
    /<meta\s+name=["']twitter:title["'][^>]*>/i,
    `<meta name="twitter:title" content="${escapeAttr(safeTitle)}" />`,
  );

  nextHtml = nextHtml.replace(
    /<meta\s+property=["']og:description["'][^>]*>/i,
    `<meta property="og:description" content="${escapeAttr(
      safeDescription,
    )}" />`,
  );

  nextHtml = nextHtml.replace(
    /<meta\s+name=["']twitter:description["'][^>]*>/i,
    `<meta name="twitter:description" content="${escapeAttr(
      safeDescription,
    )}" />`,
  );

  if (image) {
    const safeImage = escapeAttr(image);

    nextHtml = nextHtml.replace(
      /<meta\s+property=["']og:image["'][^>]*>/i,
      `<meta property="og:image" content="${safeImage}" />`,
    );

    nextHtml = nextHtml.replace(
      /<meta\s+name=["']twitter:image["'][^>]*>/i,
      `<meta name="twitter:image" content="${safeImage}" />`,
    );
  }

  return nextHtml;
}

export {
  DEFAULT_PAGE_TITLE,
  DEFAULT_DESCRIPTION,
  buildAssetMeta,
  patchHtmlWithMeta,
  normalizeAssetSymbol,
};

