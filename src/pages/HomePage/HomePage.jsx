import React, { useEffect, useMemo, useState } from 'react';
import { WATCHLIST_GROUPS } from '../../config/watchlists.js';
import { fetchQuotes, fetchChart } from '../../api/yahooClient.js';
import AssetCard from '../../components/AssetCard/AssetCard.jsx';
import BistIndexBanner from '../../components/BistIndexBanner/BistIndexBanner.jsx';
import './HomePage.css';

function HomePage() {
  const [quotes, setQuotes] = useState({});
  const [charts, setCharts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showMobileBanner, setShowMobileBanner] = useState(false);

  const allSymbols = useMemo(
    () => [...new Set(WATCHLIST_GROUPS.flatMap((group) => group.symbols))],
    [],
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const result = await fetchQuotes(allSymbols);
        if (cancelled) return;
        const bySymbol = {};
        result.forEach((item) => {
          bySymbol[item.symbol] = item;
        });
        setQuotes(bySymbol);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Veri yüklenirken hata oluştu.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [allSymbols]);

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

  useEffect(() => {
    let cancelled = false;

    async function loadCharts() {
      const entries = await Promise.all(
        allSymbols.map(async (symbol) => {
          try {
            const data = await fetchChart(symbol, '1G');
            return [symbol, data];
          } catch {
            return [symbol, []];
          }
        }),
      );

      if (cancelled) return;

      const bySymbol = {};
      entries.forEach(([symbol, data]) => {
        bySymbol[symbol] = data;
      });
      setCharts(bySymbol);
    }

    if (allSymbols.length > 0) {
      loadCharts();
    }

    return () => {
      cancelled = true;
    };
  }, [allSymbols]);

  return (
    <div className="home-root">
      <BistIndexBanner quotes={quotes} active={showMobileBanner && !loading} />

      {error && (
        <div className="home-error">
          <span>{error}</span>
        </div>
      )}

      {WATCHLIST_GROUPS.map((group) => (
        <section key={group.id} className="home-group">
          {group.title && (
            <header className="home-group-header">
              <h2 className="home-group-title">{group.title}</h2>
            </header>
          )}
          <div className="home-group-list">
            {group.symbols.map((symbol) => {
              const quote = quotes[symbol];
              const chartData = charts[symbol];
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
        </section>
      ))}

      {loading && (
        <div className="home-loading">
          <span>Veriler yükleniyor…</span>
        </div>
      )}
    </div>
  );
}

export default HomePage;
