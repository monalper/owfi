const CACHE_TTL_MS = 60 * 1000;
const API_BASE = '/api/yahoo';

const cache = new Map();

// Aralık ayarlarını biraz daha hassaslaştırdık (Örn: 1G için 2m)
const RANGE_PARAMS = {
  '1G': { range: '1d', interval: '2m' },   // Daha detaylı gün içi grafik
  '1H': { range: '5d', interval: '15m' },  // 1 Hafta (5 iş günü)
  '1A': { range: '1mo', interval: '60m' }, // 1 Ay için saatlik veri
  '3A': { range: '3mo', interval: '1d' },
  '6A': { range: '6mo', interval: '1d' },
  '1Y': { range: '1y', interval: '1d' },
  '5Y': { range: '5y', interval: '1wk' },
  MAX: { range: 'max', interval: '1mo' },
};

function resolveRangeParams(rangeKey) {
  return RANGE_PARAMS[rangeKey] || RANGE_PARAMS['1G'];
}

async function fetchWithCache(url) {
  const now = Date.now();
  const cached = cache.get(url);

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Yahoo Finance isteği başarısız: ${response.status}`);
  }

  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    const text = await response.text();
    const preview = text.slice(0, 120);
    throw new Error(
      `Yahoo Finance JSON yerine farklı bir içerik döndü (content-type: ${contentType}, preview: ${preview})`,
    );
  }

  const data = await response.json();
  cache.set(url, { timestamp: now, data });

  return data;
}

export async function fetchQuotes(symbols) {
  const cleanSymbols = symbols.filter(Boolean);
  const results = await Promise.all(
    cleanSymbols.map(async (symbol) => {
      try {
        const url = `${API_BASE}/v8/finance/chart/${encodeURIComponent(
          symbol,
        )}?range=1d&interval=1d&lang=tr-TR&region=TR`;
        const json = await fetchWithCache(url);
        const chartResult = json?.chart?.result?.[0];

        if (!chartResult) return null;

        const meta = chartResult.meta || {};
        const price = meta.regularMarketPrice;
        const previousClose =
          typeof meta.previousClose === 'number'
            ? meta.previousClose
            : meta.chartPreviousClose;

        let change = null;
        let changePercent = null;

        if (
          typeof price === 'number' &&
          typeof previousClose === 'number' &&
          previousClose !== 0
        ) {
          change = price - previousClose;
          changePercent = (change / previousClose) * 100;
        }

        return {
          symbol: meta.symbol || symbol,
          longName: meta.longName,
          shortName: meta.shortName,
          regularMarketPrice: price,
          regularMarketDayHigh: meta.regularMarketDayHigh,
          regularMarketDayLow: meta.regularMarketDayLow,
          regularMarketVolume: meta.regularMarketVolume,
          marketCap: meta.marketCap,
          fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
          regularMarketChange: change,
          regularMarketChangePercent: changePercent,
        };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('fetchQuotes sembol hatası:', symbol, error);
        return null;
      }
    }),
  );

  const validResults = results.filter(Boolean);

  if (!validResults.length) {
    throw new Error('Hiçbir sembol için Yahoo verisi alınamadı.');
  }

  return validResults;
}

export async function fetchChart(symbol, rangeKey) {
  const params = resolveRangeParams(rangeKey);

  const url = `${API_BASE}/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?range=${params.range}&interval=${params.interval}&lang=tr-TR&region=TR`;

  const json = await fetchWithCache(url);
  const result = json?.chart?.result?.[0];

  if (!result) {
    return [];
  }

  const meta = result.meta || {};
  const timestamps = result.timestamp || [];
  const quotes = result.indicators?.quote?.[0] || {};
  const closes = quotes.close || [];

  if (!timestamps.length || !closes.length) {
    return [];
  }

  // Veri setindeki ilk geçerli fiyat (null olmayan)
  const firstDataPoint = closes.find((value) => typeof value === 'number');

  if (typeof firstDataPoint !== 'number') {
    return [];
  }

  // REFERANS FİYAT BELİRLEME (CRITICAL FIX)
  // 1G (Günlük) grafiklerde referans "Dünkü Kapanış" olmalıdır.
  // Diğerlerinde (1A, 1Y vs.) referans "İlk Veri Noktası"dır.
  let referencePrice;

  if (rangeKey === '1G') {
    // chartPreviousClose genellikle en doğru veridir
    if (typeof meta.chartPreviousClose === 'number') {
      referencePrice = meta.chartPreviousClose;
    } else if (typeof meta.previousClose === 'number') {
      referencePrice = meta.previousClose;
    } else {
      referencePrice = firstDataPoint;
    }
  } else {
    // Uzun vadeli grafiklerde başlangıç noktası referanstır
    referencePrice = firstDataPoint;
  }

  // Güvenlik: Sıfıra bölünme hatasını önle
  if (!referencePrice || referencePrice === 0) {
    referencePrice = firstDataPoint;
  }

  const points = [];

  for (let i = 0; i < timestamps.length; i += 1) {
    const price = closes[i];
    if (typeof price !== 'number') {
      // eslint-disable-next-line no-continue
      continue;
    }

    // Yüzdelik değişimi referans fiyata göre hesapla
    const changePct = ((price - referencePrice) / referencePrice) * 100;

    points.push({
      time: new Date(timestamps[i] * 1000),
      price,
      changePct,
    });
  }

  return points;
}

export async function fetchRangeStats(symbol, rangeKey) {
  if (!symbol || !rangeKey || rangeKey === '1G') {
    return null;
  }

  const params = resolveRangeParams(rangeKey);

  const url = `${API_BASE}/v8/finance/spark?symbols=${encodeURIComponent(
    symbol,
  )}&range=${params.range}&interval=${params.interval}&lang=tr-TR&region=TR`;

  const json = await fetchWithCache(url);

  if (!json || typeof json !== 'object') {
    return null;
  }

  let series = json[symbol];

  if (!series) {
    const upper = symbol.toUpperCase();
    series = json[upper];
  }

  if (!series) {
    const values = Object.values(json);
    series = values[0];
  }

  if (!series || !Array.isArray(series.close) || series.close.length === 0) {
    return null;
  }

  const closes = series.close;

  const firstClose = closes.find((value) => typeof value === 'number');
  const lastClose = [...closes]
    .reverse()
    .find((value) => typeof value === 'number');

  if (typeof firstClose !== 'number' || typeof lastClose !== 'number') {
    return null;
  }

  const change = lastClose - firstClose;
  const changePercent =
    firstClose !== 0 ? (change / firstClose) * 100 : 0;

  return {
    lastPrice: lastClose,
    change,
    changePercent,
  };
}

export async function searchSymbols(query, { limit = 100 } = {}) {
  const trimmed = String(query ?? '').trim();
  if (!trimmed) {
    return [];
  }

  const safeLimit =
    Number.isFinite(limit) && limit > 0 ? Math.min(limit, 200) : 100;

  const url = `${API_BASE}/v1/finance/search?q=${encodeURIComponent(
    trimmed,
  )}&lang=tr-TR&region=TR&quotesCount=${safeLimit}&newsCount=0`;

  const json = await fetchWithCache(url);
  const quotes = Array.isArray(json?.quotes) ? json.quotes : [];

  if (!quotes.length) {
    return [];
  }

  const normalizedQuery = trimmed.toLowerCase();

  const scoreQuote = (quote) => {
    const symbol = String(quote.symbol ?? '').toLowerCase();
    const shortname = String(quote.shortname ?? '').toLowerCase();
    const longname = String(quote.longname ?? '').toLowerCase();

    let score = 0;

    if (symbol === normalizedQuery) score += 100;
    if (shortname === normalizedQuery) score += 90;
    if (longname === normalizedQuery) score += 90;

    if (shortname.includes(normalizedQuery)) score += 40;
    if (longname.includes(normalizedQuery)) score += 40;

    if (symbol.startsWith(normalizedQuery)) score += 30;

    return score;
  };

  const sorted = quotes
    .slice()
    .sort((a, b) => scoreQuote(b) - scoreQuote(a));

  return sorted;
}

export async function fetchCompanyProfile(symbol) {
  if (!symbol) return null;

  const url = `${API_BASE}/v1/finance/search?q=${encodeURIComponent(
    symbol,
  )}&lang=tr-TR&region=TR&quotesCount=1&newsCount=0`;

  const json = await fetchWithCache(url);
  const quote = json?.quotes?.[0];

  if (!quote) {
    return null;
  }

  return {
    symbol: quote.symbol,
    shortName: quote.shortname,
    longName: quote.longname,
    exchange: quote.exchange,
    exchangeDisplay: quote.exchDisp,
    sector: quote.sectorDisp || quote.sector,
    industry: quote.industryDisp || quote.industry,
    quoteType: quote.quoteType,
    typeDisplay: quote.typeDisp,
  };
}

export async function fetchCompanyNews(symbol, { count = 6 } = {}) {
  if (!symbol) return [];

  const safeCount = Number.isFinite(count) && count > 0 ? count : 6;

  const url = `${API_BASE}/v1/finance/search?q=${encodeURIComponent(
    symbol,
  )}&lang=en-US&region=US&quotesCount=0&newsCount=${safeCount}`;

  const json = await fetchWithCache(url);
  const items = Array.isArray(json?.news) ? json.news : [];

  const upperSymbol = String(symbol).toUpperCase();
  const baseSymbol = upperSymbol.replace(/\.IS$/i, '');

  const filtered = items.filter((item) => {
    const tickersRaw = item && Array.isArray(item.relatedTickers)
      ? item.relatedTickers
      : [];

    const tickers = tickersRaw.map((t) => String(t).toUpperCase());

    if (tickers.includes(upperSymbol)) return true;
    if (baseSymbol && tickers.includes(baseSymbol)) return true;

    return false;
  });

  const finalItems = filtered;

  return finalItems.map((item) => ({
    id: item.uuid || item.link || `${item.title}-${item.publisher}`,
    title: item.title,
    publisher: item.publisher,
    link: item.link,
    publishedAt: item.providerPublishTime
      ? new Date(item.providerPublishTime * 1000)
      : null,
    thumbnailUrl: item.thumbnail?.resolutions?.[0]?.url || null,
    type: item.type,
  }));
}
