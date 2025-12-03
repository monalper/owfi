import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
} from 'react';
import { useParams } from 'react-router-dom';
import { TbArrowUpRight, TbArrowDownLeft } from 'react-icons/tb';
import { RiBookmarkLine, RiBookmarkFill } from 'react-icons/ri';
import {
  fetchChart,
  fetchQuotes,
  fetchRangeStats,
  fetchCompanyProfile,
  fetchCompanyNews,
} from '../../api/yahooClient.js';
import { FaYahoo } from 'react-icons/fa';
import { WATCHLIST_GROUPS } from '../../config/watchlists.js';
import AssetChart from '../../components/AssetChart/AssetChart.jsx';
import AssetCard from '../../components/AssetCard/AssetCard.jsx';
import TimeRangeToggle from '../../components/TimeRangeToggle/TimeRangeToggle.jsx';
import NewsCard from '../../components/NewsCard/NewsCard.jsx';
import {
  isSymbolBookmarked,
  toggleSymbolBookmark,
} from '../../utils/bookmarksStorage.js';
import './AssetDetailPage.css';

const priceFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function RelatedAssetsSection({ symbol }) {
  const [quotesBySymbol, setQuotesBySymbol] = useState({});
  const [chartsBySymbol, setChartsBySymbol] = useState({});
  const [loading, setLoading] = useState(false);

  const relatedSymbols = useMemo(() => {
    if (!symbol) return [];

    const upper = symbol.toUpperCase();

    const directGroup = WATCHLIST_GROUPS.find((group) =>
      group.symbols.some((s) => s.toUpperCase() === upper),
    );

    if (directGroup) {
      return directGroup.symbols.filter((s) => s.toUpperCase() !== upper);
    }

    const isBist = upper.endsWith('.IS') || upper.startsWith('XU');
    const isFx =
      upper.includes('=X') && upper !== 'GC=F' && upper !== 'SI=F';
    const isCommodity =
      upper === 'GC=F' ||
      upper === 'SI=F' ||
      upper === 'XAUUSD=X' ||
      upper === 'XAGUSD=X';
    const isUs = !isBist && !isFx && !isCommodity;

    let fallbackId = null;
    if (isBist) fallbackId = 'equities';
    else if (isFx) fallbackId = 'fx';
    else if (isCommodity) fallbackId = 'commodities';
    else if (isUs) fallbackId = 'us-companies';

    if (!fallbackId) return [];

    const fallbackGroup = WATCHLIST_GROUPS.find(
      (group) => group.id === fallbackId,
    );

    if (!fallbackGroup) return [];

    return fallbackGroup.symbols.filter((s) => s.toUpperCase() !== upper);
  }, [symbol]);

  useEffect(() => {
    let cancelled = false;

    async function loadRelated() {
      if (!relatedSymbols.length) {
        setQuotesBySymbol({});
        setChartsBySymbol({});
        return;
      }

      try {
        setLoading(true);

        const quotesArray = await fetchQuotes(relatedSymbols);
        if (cancelled) return;

        const nextQuotes = {};
        quotesArray.forEach((item) => {
          if (item && item.symbol) {
            nextQuotes[item.symbol] = item;
          }
        });
        setQuotesBySymbol(nextQuotes);

        const chartEntries = await Promise.all(
          relatedSymbols.map(async (relatedSymbol) => {
            try {
              const data = await fetchChart(relatedSymbol, '1G');
              return [relatedSymbol, data];
            } catch {
              return [relatedSymbol, []];
            }
          }),
        );

        if (cancelled) return;

        const nextCharts = {};
        chartEntries.forEach(([relatedSymbol, data]) => {
          nextCharts[relatedSymbol] = data;
        });
        setChartsBySymbol(nextCharts);
      } catch {
        if (!cancelled) {
          // Sessiz yut, ana hatayı bozmamak için
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRelated();

    return () => {
      cancelled = true;
    };
  }, [relatedSymbols]);

  if (!relatedSymbols.length) {
    return null;
  }

  return (
    <section className="asset-detail-related">
      <div className="asset-detail-related-header">
        <h2 className="asset-detail-related-title" />
      </div>
      <div className="asset-detail-related-list">
        {relatedSymbols.map((relatedSymbol) => {
          const directQuote = quotesBySymbol[relatedSymbol];
          const normalizedQuote =
            directQuote ||
            Object.values(quotesBySymbol).find(
              (item) =>
                item?.symbol &&
                item.symbol.toUpperCase() === relatedSymbol.toUpperCase(),
            );
          const chartDataForSymbol = chartsBySymbol[relatedSymbol];

          return (
            <AssetCard
              key={relatedSymbol}
              symbol={relatedSymbol}
              longName={normalizedQuote?.longName}
              shortName={normalizedQuote?.shortName}
              regularMarketPrice={normalizedQuote?.regularMarketPrice}
              change={normalizedQuote?.regularMarketChange}
              changePercent={normalizedQuote?.regularMarketChangePercent}
              chartData={chartDataForSymbol}
            />
          );
        })}
      </div>
      {loading && (
        <div className="asset-detail-related-loading">
          <span>İlgili varlıklar yükleniyor…</span>
        </div>
      )}
    </section>
  );
}

function AssetDetailPage() {
  const { symbol } = useParams();

  const [rangeKey, setRangeKey] = useState('1G');
  const [quote, setQuote] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [rangeStats, setRangeStats] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [error, setError] = useState(null);

  const [companyProfile, setCompanyProfile] = useState(null);
  const [companyProfileLoading, setCompanyProfileLoading] = useState(false);
  const [companyNews, setCompanyNews] = useState([]);
  const [companyNewsLoading, setCompanyNewsLoading] = useState(false);
  const [showAllNews, setShowAllNews] = useState(false);

  // Özet Bilgiler / Şirket sekmeleri için
  const [metricsTab, setMetricsTab] = useState('daily'); // 'daily' | '52w' | 'company'

  const pageRef = useRef(null);
  const chartContainerRef = useRef(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Sayfa ilk yüklendiğinde grafik alanı otomatik seçili gelmesin
  useEffect(() => {
    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      chartContainerRef.current &&
      chartContainerRef.current.contains(active)
    ) {
      active.blur();
    }
  }, []);

  // Sayfada boş bir yere tıklanınca varsa focus'u temizle
  useEffect(() => {
    function handlePointerDown(event) {
      const active = document.activeElement;

      if (!active || active === document.body) return;

      if (active instanceof HTMLElement && active.contains(event.target)) {
        return;
      }

      if (
        active instanceof HTMLElement &&
        pageRef.current &&
        pageRef.current.contains(active)
      ) {
        active.blur();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  // Fiyat / temel quote verisi
  useEffect(() => {
    let cancelled = false;

    async function loadQuote() {
      if (!symbol) return;

      try {
        setLoadingQuote(true);
        const result = await fetchQuotes([symbol]);
        if (cancelled) return;
        setQuote(result[0] || null);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Varlık bilgisi alınamadı.');
        }
      } finally {
        if (!cancelled) {
          setLoadingQuote(false);
        }
      }
    }

    loadQuote();

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  // Bookmark durumunu yükle
  useEffect(() => {
    if (!symbol) return;
    setIsBookmarked(isSymbolBookmarked(symbol));
  }, [symbol]);

  // Şirket profili
  useEffect(() => {
    let cancelled = false;

    async function loadCompanyProfile() {
      if (!symbol) {
        setCompanyProfile(null);
        return;
      }

      try {
        setCompanyProfileLoading(true);
        const profile = await fetchCompanyProfile(symbol);
        if (cancelled) return;
        setCompanyProfile(profile);
      } catch {
        if (!cancelled) {
          setCompanyProfile(null);
        }
      } finally {
        if (!cancelled) {
          setCompanyProfileLoading(false);
        }
      }
    }

    loadCompanyProfile();

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  // Şirket haberleri
  useEffect(() => {
    let cancelled = false;

    async function loadCompanyNews() {
      if (!symbol) {
        setCompanyNews([]);
        return;
      }

      try {
        setCompanyNewsLoading(true);
        const news = await fetchCompanyNews(symbol, { count: 6 });
        if (cancelled) return;
        setCompanyNews(news);
      } catch {
        if (!cancelled) {
          setCompanyNews([]);
        }
      } finally {
        if (!cancelled) {
          setCompanyNewsLoading(false);
        }
      }
    }

    loadCompanyNews();

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  // Grafik verisi
  useEffect(() => {
    let cancelled = false;

    async function loadChart() {
      if (!symbol) return;

      try {
        setLoadingChart(true);
        const data = await fetchChart(symbol, rangeKey);
        if (cancelled) return;
        setChartData(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Grafik verisi alınamadı.');
        }
      } finally {
        if (!cancelled) {
          setLoadingChart(false);
        }
      }
    }

    loadChart();

    return () => {
      cancelled = true;
    };
  }, [symbol, rangeKey]);

  // Seçilen tarih aralığına göre özet istatistik
  useEffect(() => {
    let cancelled = false;

    async function loadRangeStats() {
      if (!symbol) return;

      if (rangeKey === '1G') {
        setRangeStats(null);
        return;
      }

      try {
        const stats = await fetchRangeStats(symbol, rangeKey);
        if (cancelled) return;
        setRangeStats(stats);
      } catch {
        if (!cancelled) {
          setRangeStats(null);
        }
      }
    }

    loadRangeStats();

    return () => {
      cancelled = true;
    };
  }, [symbol, rangeKey]);

  const rawSymbol = symbol || '';
  const upperSymbol = rawSymbol.toUpperCase();

  let displaySymbol = upperSymbol.replace(/\.IS$/i, '');
  if (upperSymbol === 'XAUUSD=X') {
    displaySymbol = 'Altın';
  } else if (upperSymbol === 'XAGUSD=X') {
    displaySymbol = 'Gümüş';
  }

  const isDailyRange = rangeKey === '1G';

  const displayPrice = (() => {
    if (isDailyRange) {
      return typeof quote?.regularMarketPrice === 'number'
        ? quote.regularMarketPrice
        : null;
    }

    if (typeof rangeStats?.lastPrice === 'number') {
      return rangeStats.lastPrice;
    }

    return typeof quote?.regularMarketPrice === 'number'
      ? quote.regularMarketPrice
      : null;
  })();

  const change = (() => {
    if (isDailyRange) {
      return typeof quote?.regularMarketChange === 'number'
        ? quote.regularMarketChange
        : null;
    }

    if (typeof rangeStats?.change === 'number') {
      return rangeStats.change;
    }

    return typeof quote?.regularMarketChange === 'number'
      ? quote.regularMarketChange
      : null;
  })();

  const changePercent = (() => {
    if (isDailyRange) {
      return typeof quote?.regularMarketChangePercent === 'number'
        ? quote.regularMarketChangePercent
        : null;
    }

    if (typeof rangeStats?.changePercent === 'number') {
      return rangeStats.changePercent;
    }

    return typeof quote?.regularMarketChangePercent === 'number'
      ? quote.regularMarketChangePercent
      : null;
  })();

  const isPositive = typeof change === 'number' && change >= 0;
  const isNegative = typeof change === 'number' && change < 0;

  const formatPriceOrDash = (val) =>
    typeof val === 'number' ? priceFormatter.format(val) : '--';

  const formatIntOrDash = (val) =>
    typeof val === 'number' ? val.toLocaleString('tr-TR') : '--';

  const metricsDaily = [
    {
      key: 'dayHigh',
      label: 'Günlük En Yüksek',
      value: formatPriceOrDash(quote?.regularMarketDayHigh),
    },
    {
      key: 'dayLow',
      label: 'Günlük En Düşük',
      value: formatPriceOrDash(quote?.regularMarketDayLow),
    },
    {
      key: 'volume',
      label: 'Hacim',
      value: formatIntOrDash(quote?.regularMarketVolume),
    },
    {
      key: 'marketCap',
      label: 'Piyasa Değeri',
      value: formatIntOrDash(quote?.marketCap),
    },
  ];

  const metrics52w = [
    {
      key: '52wHigh',
      label: '52 Hafta En Yüksek',
      value: formatPriceOrDash(quote?.fiftyTwoWeekHigh),
    },
    {
      key: '52wLow',
      label: '52 Hafta En Düşük',
      value: formatPriceOrDash(quote?.fiftyTwoWeekLow),
    },
  ];

  const currentMetrics = metricsTab === 'daily' ? metricsDaily : metrics52w;
  const showMetricsGrid = metricsTab === 'daily' || metricsTab === '52w';
  const showCompanyTab = metricsTab === 'company';

  const newsUrl =
    symbol && typeof symbol === 'string'
      ? `https://finance.yahoo.com/quote/${encodeURIComponent(
          symbol,
        )}/news?p=${encodeURIComponent(symbol)}`
      : null;

  const visibleNews =
    showAllNews || !Array.isArray(companyNews)
      ? companyNews
      : companyNews.slice(0, 2);

  const handleBookmarkClick = () => {
    if (!symbol) return;
    const next = toggleSymbolBookmark(symbol);
    setIsBookmarked(next);
  };

  return (
    <div className="asset-detail-root" ref={pageRef}>
      {/* Export için AssetCard tasarımlı gizli kart + marka banner */}
      <div className="asset-detail-export-card" aria-hidden="true">
        <div className="asset-detail-export-banner">
          <img
            src="/logo.svg"
            alt="Openwall Finance"
            className="asset-detail-export-logo"
          />
          <span className="asset-detail-export-text">
            <span className="asset-detail-export-text-strong">
              Openwall Finance
            </span>{' '}
            tarafından
          </span>
        </div>
        <AssetCard
          symbol={symbol}
          longName={quote?.longName}
          shortName={quote?.shortName}
          regularMarketPrice={displayPrice}
          change={change}
          changePercent={changePercent}
          chartData={chartData}
        />
      </div>

      {error && (
        <div className="asset-detail-error">
          <span>{error}</span>
        </div>
      )}

      <section className="asset-detail-header">
        <div className="asset-detail-header-main">
          <div className="asset-detail-header-text">
            <h1 className="asset-detail-symbol">{displaySymbol}</h1>
            <p className="asset-detail-name">
              {quote?.longName || quote?.shortName || 'Varlık bilgisi yükleniyor'}
            </p>
          </div>
        </div>
        <div className="asset-detail-price-block">
          <button
            type="button"
            className={`asset-detail-bookmark-button ${
              isBookmarked ? 'asset-detail-bookmark-button--active' : ''
            }`}
            onClick={handleBookmarkClick}
            aria-pressed={isBookmarked}
            aria-label={
              isBookmarked
                ? 'Kaydedilenlerden kaldır'
                : 'Kaydedilenlere ekle'
            }
          >
            {isBookmarked ? (
              <RiBookmarkFill className="asset-detail-bookmark-icon" />
            ) : (
              <RiBookmarkLine className="asset-detail-bookmark-icon" />
            )}
          </button>
          <div className="asset-detail-price">
            {typeof displayPrice === 'number'
              ? priceFormatter.format(displayPrice)
              : '--'}
          </div>
          <div className="asset-detail-change-row">
            {isPositive && (
              <>
                <TbArrowUpRight className="asset-detail-change-icon asset-detail-change-icon-positive" />
                <span className="asset-detail-change-value asset-detail-change-value-positive">
                  {priceFormatter.format(Math.abs(change))}
                </span>
                <span className="asset-detail-change-percent asset-detail-change-value-positive">
                  %{percentFormatter.format(Math.abs(changePercent))}
                </span>
              </>
            )}
            {isNegative && (
              <>
                <TbArrowDownLeft className="asset-detail-change-icon asset-detail-change-icon-negative" />
                <span className="asset-detail-change-value asset-detail-change-value-negative">
                  {priceFormatter.format(Math.abs(change))}
                </span>
                <span className="asset-detail-change-percent asset-detail-change-value-negative">
                  %{percentFormatter.format(Math.abs(changePercent))}
                </span>
              </>
            )}
            {!isPositive && !isNegative && (
              <span className="asset-detail-change-muted">--</span>
            )}
          </div>
        </div>
      </section>

      <section className="asset-detail-chart-section">
        <div className="asset-detail-chart-header">
          <h2 className="asset-detail-chart-title" />
          <div className="asset-detail-chart-toggle-desktop">
            <TimeRangeToggle value={rangeKey} onChange={setRangeKey} />
          </div>
        </div>
        <div className="asset-detail-chart-card" ref={chartContainerRef}>
          {loadingChart ? (
            <div className="asset-detail-loading">Grafik yükleniyor…</div>
          ) : null}
          {!loadingChart && <AssetChart data={chartData} />}
        </div>
        <div className="asset-detail-chart-toggle-mobile">
          <TimeRangeToggle value={rangeKey} onChange={setRangeKey} />
        </div>
      </section>

      <section className="asset-detail-metrics">
        <div className="asset-detail-metrics-header">
          <h2 className="asset-detail-metrics-title">
            {metricsTab === 'company' ? 'Şirket Detayları' : 'Özet Bilgiler'}
          </h2>
        </div>

        <div className="asset-detail-metrics-tabs">
          <button
            type="button"
            className={`asset-detail-metrics-tab ${
              metricsTab === 'daily' ? 'asset-detail-metrics-tab--active' : ''
            }`}
            onClick={() => setMetricsTab('daily')}
          >
            Günlük
          </button>
          <button
            type="button"
            className={`asset-detail-metrics-tab ${
              metricsTab === '52w' ? 'asset-detail-metrics-tab--active' : ''
            }`}
            onClick={() => setMetricsTab('52w')}
          >
            52 Hafta
          </button>
          <button
            type="button"
            className={`asset-detail-metrics-tab ${
              metricsTab === 'company'
                ? 'asset-detail-metrics-tab--active'
                : ''
            }`}
            onClick={() => setMetricsTab('company')}
          >
            Şirket
          </button>
        </div>

        {showMetricsGrid && (
          <div className="asset-detail-metrics-grid">
            {currentMetrics.map((metric) => (
              <div key={metric.key} className="asset-detail-metric">
                <span className="asset-detail-metric-label">
                  {metric.label}
                </span>
                <span className="asset-detail-metric-value">
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {showCompanyTab && (companyProfile || companyProfileLoading) && (
          <div className="asset-detail-company">
            {companyProfileLoading && !companyProfile && (
              <div className="asset-detail-loading">
                Şirket bilgileri yükleniyor…
              </div>
            )}
            {companyProfile && (
              <div className="asset-detail-company-grid">
                {(companyProfile.exchangeDisplay ||
                  companyProfile.exchange) && (
                  <div className="asset-detail-company-item">
                    <span className="asset-detail-company-label">Borsa</span>
                    <span className="asset-detail-company-value">
                      {companyProfile.exchangeDisplay ||
                        companyProfile.exchange}
                    </span>
                  </div>
                )}
                {(companyProfile.sector || companyProfile.industry) && (
                  <div className="asset-detail-company-item">
                    <span className="asset-detail-company-label">
                      Sektör / Endüstri
                    </span>
                    <span className="asset-detail-company-value">
                      {companyProfile.sector}
                      {companyProfile.sector && companyProfile.industry
                        ? ' • '
                        : ''}
                      {companyProfile.industry}
                    </span>
                  </div>
                )}
                {(companyProfile.typeDisplay || companyProfile.quoteType) && (
                  <div className="asset-detail-company-item">
                    <span className="asset-detail-company-label">
                      Varlık Tipi
                    </span>
                    <span className="asset-detail-company-value">
                      {companyProfile.typeDisplay || companyProfile.quoteType}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {(companyNewsLoading || (companyNews && companyNews.length > 0)) && (
        <section className="asset-detail-news">
          <div className="asset-detail-news-header">
            <h2 className="asset-detail-news-title">Şirket Haberleri</h2>
          </div>
          {companyNewsLoading && (
            <div className="asset-detail-loading">Haberler yükleniyor…</div>
          )}
          {!companyNewsLoading && companyNews && companyNews.length === 0 && (
            <div className="asset-detail-news-empty">
              <span>Şu anda görüntülenecek haber bulunamadı.</span>
            </div>
          )}
          {!companyNewsLoading && companyNews && companyNews.length > 0 && (
            <>
              <div className="asset-detail-news-list">
                {visibleNews.map((item) => (
                  <NewsCard
                    key={item.id}
                    title={item.title}
                    publisher={item.publisher}
                    publishedAt={item.publishedAt}
                    thumbnailUrl={item.thumbnailUrl}
                    link={item.link}
                  />
                ))}
              </div>
              <div className="asset-detail-news-more">
                {!showAllNews && companyNews.length > 2 && (
                  <button
                    type="button"
                    className="asset-detail-news-more-button"
                    onClick={() => setShowAllNews(true)}
                  >
                    Daha fazla haber
                  </button>
                )}
                {showAllNews && newsUrl && (
                  <>
                    <a
                      href={newsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="asset-detail-news-yahoo-link"
                    >
                      <FaYahoo className="asset-detail-news-yahoo-icon" />
                      <span>Yahoo&apos;da devam et</span>
                    </a>
                    {companyNews.length > 2 && (
                      <button
                        type="button"
                        className="asset-detail-news-less-button"
                        onClick={() => setShowAllNews(false)}
                      >
                        Daha az haber
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </section>
      )}

      <RelatedAssetsSection symbol={symbol} />

      {loadingQuote && (
        <div className="asset-detail-loading">
          <span>Veriler yükleniyor…</span>
        </div>
      )}
    </div>
  );
}

export default AssetDetailPage;
