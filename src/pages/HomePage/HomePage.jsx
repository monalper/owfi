import React, { useEffect, useMemo, useState } from 'react';
import { WATCHLIST_GROUPS } from '../../config/watchlists.js';
import { fetchQuotes } from '../../api/yahooClient.js';
import AssetCard from '../../components/AssetCard/AssetCard.jsx';
import './HomePage.css';

function HomePage() {
  const [quotes, setQuotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="home-root">
      {error && (
        <div className="home-error">
          <span>{error}</span>
        </div>
      )}

      {WATCHLIST_GROUPS.map((group) => (
        <section key={group.id} className="home-group">
          <header className="home-group-header">
            <div>
              <h2 className="home-group-title">{group.title}</h2>
            </div>
          </header>
          <div className="home-group-list">
            {group.symbols.map((symbol) => {
              const quote = quotes[symbol];
              return (
                <AssetCard
                  key={symbol}
                  symbol={symbol}
                  longName={quote?.longName}
                  shortName={quote?.shortName}
                  regularMarketPrice={quote?.regularMarketPrice}
                  change={quote?.regularMarketChange}
                  changePercent={quote?.regularMarketChangePercent}
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

