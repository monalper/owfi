import React, { useEffect, useRef, useState } from 'react';
import { WATCHLIST_GROUPS } from '../../config/watchlists.js';
import { PRESET_LISTS } from '../../config/lists.js';
import {
  fetchQuotes,
  fetchChart,
  fetchScreenerQuotes,
} from '../../api/yahooClient.js';
import AssetCard from '../../components/AssetCard/AssetCard.jsx';
import BistIndexBanner from '../../components/BistIndexBanner/BistIndexBanner.jsx';
import { usePageMetaTitle } from '../../utils/pageMeta.js';
import './HomePage.css';

const BIST_INDEX_SYMBOLS = ['XU030.IS', 'XU050.IS', 'XU100.IS'];

const CRYPTO_LIST = PRESET_LISTS.find(
  (list) => list.id === 'kripto-en-buyukler',
);
const CRYPTO_SYMBOLS = CRYPTO_LIST?.symbols || [];

const DEFAULT_GERMAN_SYMBOLS = [
  'SIE.DE',
  'VOW3.DE',
  'SAP.DE',
  'BMW.DE',
  'ALV.DE',
  'BAS.DE',
  'BAYN.DE',
  'ADS.DE',
  'DTE.DE',
  'DBK.DE',
];

const DEFAULT_FRENCH_SYMBOLS = [
  'AIR.PA',
  'RMS.PA',
  'MC.PA',
  'OR.PA',
  'BNP.PA',
  'SAN.PA',
  'ENGI.PA',
  'DG.PA',
  'SU.PA',
  'ACA.PA',
];

const EURO_BLUE_CHIPS_LIST = PRESET_LISTS.find(
  (list) => list.id === 'avrupa-mavi-cipler',
);

const GERMAN_SYMBOLS = (() => {
  const fromList =
    EURO_BLUE_CHIPS_LIST?.symbols?.filter((symbol) =>
      String(symbol).toUpperCase().endsWith('.DE'),
    ) || [];
  return fromList.length >= 10 ? fromList : DEFAULT_GERMAN_SYMBOLS;
})();

const FRENCH_SYMBOLS = (() => {
  const fromList =
    EURO_BLUE_CHIPS_LIST?.symbols?.filter((symbol) =>
      String(symbol).toUpperCase().endsWith('.PA'),
    ) || [];
  return fromList.length >= 10 ? fromList : DEFAULT_FRENCH_SYMBOLS;
})();

function useLazySection() {
  const [shouldLoad, setShouldLoad] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (shouldLoad) return;

    if (
      typeof window === 'undefined' ||
      typeof IntersectionObserver === 'undefined'
    ) {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      { root: null, threshold: 0.15 },
    );

    const element = sectionRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [shouldLoad]);

  return { sectionRef, shouldLoad };
}

function WatchlistGroupSection({ group }) {
  const { sectionRef, shouldLoad } = useLazySection();
  const [quotesBySymbol, setQuotesBySymbol] = useState({});
  const [chartsBySymbol, setChartsBySymbol] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shouldLoad) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const quotesArray = await fetchQuotes(group.symbols);
        if (cancelled) return;

        const nextQuotes = {};
        quotesArray.forEach((item) => {
          if (item && item.symbol) {
            nextQuotes[item.symbol] = item;
          }
        });
        setQuotesBySymbol(nextQuotes);

        const entries = await Promise.all(
          group.symbols.map(async (symbol) => {
            try {
              const data = await fetchChart(symbol, '1G');
              return [symbol, data];
            } catch {
              return [symbol, []];
            }
          }),
        );

        if (cancelled) return;

        const nextCharts = {};
        entries.forEach(([symbol, data]) => {
          nextCharts[symbol] = data;
        });
        setChartsBySymbol(nextCharts);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Veri yuklenirken hata olustu.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [shouldLoad, group.symbols]);

  return (
    <section ref={sectionRef} className="home-group">
      {group.title && (
        <header className="home-group-header">
          <h2 className="home-group-title">{group.title}</h2>
        </header>
      )}
      <div className="home-group-list">
        {group.symbols.map((symbol) => {
          const directQuote = quotesBySymbol[symbol];
          const quote =
            directQuote ||
            Object.values(quotesBySymbol).find(
              (item) =>
                item?.symbol &&
                item.symbol.toUpperCase() === symbol.toUpperCase(),
            );
          const chartData = chartsBySymbol[symbol];

          return (
            <AssetCard
              key={symbol}
              symbol={symbol}
              longName={quote?.longName}
              shortName={quote?.shortName}
              regularMarketPrice={quote?.regularMarketPrice}
              change={quote?.regularMarketChange}
              changePercent={quote?.regularMarketChangePercent}
              chartData={chartData}
            />
          );
        })}
      </div>
      {error && (
        <div className="home-error">
          <span>{error}</span>
        </div>
      )}
      {loading && (
        <div className="home-loading">
          <span>Veriler yukleniyor...</span>
        </div>
      )}
    </section>
  );
}

function StaticSymbolsSection({ title, symbols }) {
  const { sectionRef, shouldLoad } = useLazySection();
  const [quotesBySymbol, setQuotesBySymbol] = useState({});
  const [chartsBySymbol, setChartsBySymbol] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shouldLoad) return;
    if (!symbols || symbols.length === 0) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const quotesArray = await fetchQuotes(symbols);
        if (cancelled) return;

        const nextQuotes = {};
        quotesArray.forEach((item) => {
          if (item && item.symbol) {
            nextQuotes[item.symbol] = item;
          }
        });
        setQuotesBySymbol(nextQuotes);

        const entries = await Promise.all(
          symbols.map(async (symbol) => {
            try {
              const data = await fetchChart(symbol, '1G');
              return [symbol, data];
            } catch {
              return [symbol, []];
            }
          }),
        );

        if (cancelled) return;

        const nextCharts = {};
        entries.forEach(([symbol, data]) => {
          nextCharts[symbol] = data;
        });
        setChartsBySymbol(nextCharts);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Veri yuklenirken hata olustu.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [shouldLoad, symbols]);

  if (!symbols || symbols.length === 0) {
    return null;
  }

  return (
    <section ref={sectionRef} className="home-group">
      <header className="home-group-header">
        <h2 className="home-group-title">{title}</h2>
      </header>
      <div className="home-group-list">
        {symbols.map((symbol) => {
          const directQuote = quotesBySymbol[symbol];
          const quote =
            directQuote ||
            Object.values(quotesBySymbol).find(
              (item) =>
                item?.symbol &&
                item.symbol.toUpperCase() === symbol.toUpperCase(),
            );
          const chartData = chartsBySymbol[symbol];

          return (
            <AssetCard
              key={symbol}
              symbol={symbol}
              longName={quote?.longName}
              shortName={quote?.shortName}
              regularMarketPrice={quote?.regularMarketPrice}
              change={quote?.regularMarketChange}
              changePercent={quote?.regularMarketChangePercent}
              chartData={chartData}
            />
          );
        })}
      </div>
      {error && (
        <div className="home-error">
          <span>{error}</span>
        </div>
      )}
      {loading && (
        <div className="home-loading">
          <span>Veriler yukleniyor...</span>
        </div>
      )}
    </section>
  );
}

function BistTopMoversSection() {
  const { sectionRef, shouldLoad } = useLazySection();
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [chartsBySymbol, setChartsBySymbol] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shouldLoad) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [gainersData, losersData] = await Promise.all([
          fetchScreenerQuotes({
            scrId: 'day_gainers_europe',
            region: 'TR',
            count: 250,
          }),
          fetchScreenerQuotes({
            scrId: 'day_losers_europe',
            region: 'TR',
            count: 250,
          }),
        ]);
        if (cancelled) return;

        const isBistSymbol = (item) =>
          item &&
          typeof item.symbol === 'string' &&
          item.symbol.toUpperCase().endsWith('.IS');

        const bistGainers = gainersData.filter(isBistSymbol);
        const bistLosers = losersData.filter(isBistSymbol);

        const topGainers = bistGainers
          .slice()
          .sort(
            (a, b) =>
              b.regularMarketChangePercent - a.regularMarketChangePercent,
          )
          .slice(0, 8);

        const topLosers = bistLosers
          .slice()
          .sort(
            (a, b) =>
              a.regularMarketChangePercent - b.regularMarketChangePercent,
          )
          .slice(0, 8);

        setGainers(topGainers);
        setLosers(topLosers);

        const symbolsSet = new Set([
          ...topGainers.map((item) => item.symbol),
          ...topLosers.map((item) => item.symbol),
        ]);

        const entries = await Promise.all(
          Array.from(symbolsSet)
            .filter(Boolean)
            .map(async (symbol) => {
              try {
                const data = await fetchChart(symbol, '1G');
                return [symbol, data];
              } catch {
                return [symbol, []];
              }
            }),
        );

        if (cancelled) return;

        const nextCharts = {};
        entries.forEach(([symbol, data]) => {
          nextCharts[symbol] = data;
        });
        setChartsBySymbol(nextCharts);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Veri yuklenirken hata olustu.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

      return () => {
      cancelled = true;
    };
  }, [shouldLoad]);

  const renderList = (items, title, key) => (
    <section key={key} className="home-group">
      <header className="home-group-header">
        <h2 className="home-group-title">{title}</h2>
      </header>
      <div className="home-group-list">
        {items.map((item) => (
          <AssetCard
            key={item.symbol}
            symbol={item.symbol}
            longName={item.longName}
            shortName={item.shortName}
            regularMarketPrice={item.regularMarketPrice}
            change={item.regularMarketChange}
            changePercent={item.regularMarketChangePercent}
            chartData={chartsBySymbol[item.symbol]}
          />
        ))}
      </div>
    </section>
  );

  return (
    <div ref={sectionRef}>
      {renderList(gainers, 'BIST En Cok Yukselenler', 'bist-gainers')}
      {renderList(losers, 'BIST En Cok Dusenler', 'bist-losers')}
      {error && (
        <div className="home-error">
          <span>{error}</span>
        </div>
      )}
      {loading && (
        <div className="home-loading">
          <span>Veriler yukleniyor...</span>
        </div>
      )}
    </div>
  );
}

function UsTopMoversSection() {
  const { sectionRef, shouldLoad } = useLazySection();
  const [gainers, setGainers] = useState([]);
  const [losers, setLosers] = useState([]);
  const [chartsBySymbol, setChartsBySymbol] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shouldLoad) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [gainersData, losersData] = await Promise.all([
          fetchScreenerQuotes({
            scrId: 'day_gainers',
            region: 'US',
            count: 20,
          }),
          fetchScreenerQuotes({
            scrId: 'day_losers',
            region: 'US',
            count: 20,
          }),
        ]);

        if (cancelled) return;

        const topGainers = gainersData.slice(0, 8);
        const topLosers = losersData.slice(0, 8);

        setGainers(topGainers);
        setLosers(topLosers);

        const symbolsSet = new Set([
          ...topGainers.map((item) => item.symbol),
          ...topLosers.map((item) => item.symbol),
        ]);

        const entries = await Promise.all(
          Array.from(symbolsSet)
            .filter(Boolean)
            .map(async (symbol) => {
              try {
                const data = await fetchChart(symbol, '1G');
                return [symbol, data];
              } catch {
                return [symbol, []];
              }
            }),
        );

        if (cancelled) return;

        const nextCharts = {};
        entries.forEach(([symbol, data]) => {
          nextCharts[symbol] = data;
        });
        setChartsBySymbol(nextCharts);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Veri yuklenirken hata olustu.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [shouldLoad]);

  const renderList = (items, title, key) => (
    <section key={key} className="home-group">
      <header className="home-group-header">
        <h2 className="home-group-title">{title}</h2>
      </header>
      <div className="home-group-list">
        {items.map((item) => (
          <AssetCard
            key={item.symbol}
            symbol={item.symbol}
            longName={item.longName}
            shortName={item.shortName}
            regularMarketPrice={item.regularMarketPrice}
            change={item.regularMarketChange}
            changePercent={item.regularMarketChangePercent}
            chartData={chartsBySymbol[item.symbol]}
          />
        ))}
      </div>
    </section>
  );

  return (
    <div ref={sectionRef}>
      {renderList(gainers, 'ABD En Cok Yukselenler', 'us-gainers')}
      {renderList(losers, 'ABD En Cok Dusenler', 'us-losers')}
      {error && (
        <div className="home-error">
          <span>{error}</span>
        </div>
      )}
      {loading && (
        <div className="home-loading">
          <span>Veriler yukleniyor...</span>
        </div>
      )}
    </div>
  );
}

function HomePage() {
  const [bannerQuotes, setBannerQuotes] = useState({});
  const [bannerLoading, setBannerLoading] = useState(true);
  const [bannerError, setBannerError] = useState(null);
  const [showMobileBanner, setShowMobileBanner] = useState(false);

  usePageMetaTitle('Openwall Finance | Piyasalar');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setBannerLoading(true);
        setBannerError(null);

        const result = await fetchQuotes(BIST_INDEX_SYMBOLS);
        if (cancelled) return;

        const bySymbol = {};
        result.forEach((item) => {
          if (item && item.symbol) {
            bySymbol[item.symbol] = item;
          }
        });
        setBannerQuotes(bySymbol);
      } catch (err) {
        if (!cancelled) {
          setBannerError(err.message || 'Veri yuklenirken hata olustu.');
        }
      } finally {
        if (!cancelled) {
          setBannerLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleScrollOrResize() {
      if (typeof window === 'undefined') return;
      const isMobile = window.innerWidth <= 768;
      const scrollY = window.scrollY || window.pageYOffset || 0;

      const shouldShow = isMobile && scrollY > 80;

      setShowMobileBanner((prev) =>
        prev === shouldShow ? prev : shouldShow,
      );
    }

    handleScrollOrResize();

    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

  return (
    <div className="home-root">
      <BistIndexBanner
        quotes={bannerQuotes}
        active={showMobileBanner && !bannerLoading}
      />

      {bannerError && (
        <div className="home-error">
          <span>{bannerError}</span>
        </div>
      )}

      {WATCHLIST_GROUPS.map((group) => (
        <WatchlistGroupSection key={group.id} group={group} />
      ))}

      <BistTopMoversSection />
      <UsTopMoversSection />
      <StaticSymbolsSection title="Kripto Para" symbols={CRYPTO_SYMBOLS} />
      <StaticSymbolsSection title="Alman Borsasi" symbols={GERMAN_SYMBOLS} />
      <StaticSymbolsSection title="Fransa Borsasi" symbols={FRENCH_SYMBOLS} />
    </div>
  );
}

export default HomePage;
