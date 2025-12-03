import React, { useEffect, useMemo, useState } from 'react';
import AssetCard from '../../components/AssetCard/AssetCard.jsx';
import { fetchChart, fetchQuotes } from '../../api/yahooClient.js';
import {
  getBookmarkedSymbols,
  setBookmarkedSymbols,
} from '../../utils/bookmarksStorage.js';
import './BookmarksPage.css';

function BookmarksPage() {
  const [symbols, setSymbols] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [charts, setCharts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initial = getBookmarkedSymbols();
    setSymbols(initial);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!symbols.length) {
        setQuotes({});
        setCharts({});
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const result = await fetchQuotes(symbols);
        if (cancelled) return;

        const bySymbol = {};
        result.forEach((item) => {
          if (item && item.symbol) {
            bySymbol[item.symbol] = item;
          }
        });
        setQuotes(bySymbol);

        const chartEntries = await Promise.all(
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

        const bySymbolCharts = {};
        chartEntries.forEach(([symbol, data]) => {
          bySymbolCharts[symbol] = data;
        });
        setCharts(bySymbolCharts);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Kaydedilenler yüklenirken hata oluştu.');
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
  }, [symbols]);

  const handleClearAll = () => {
    setBookmarkedSymbols([]);
    setSymbols([]);
  };

  const orderedSymbols = useMemo(
    () => symbols.slice().sort((a, b) => a.localeCompare(b)),
    [symbols],
  );

  return (
    <div className="bookmarks-root">
      <header className="bookmarks-header">
        <div>
          <h1 className="bookmarks-title">Kaydedilenler</h1>
          <p className="bookmarks-subtitle">
            Favori hisse, fon ve dövizlerinizi tek yerde görün.
          </p>
        </div>
        {symbols.length > 0 && (
          <button
            type="button"
            className="bookmarks-clear-button"
            onClick={handleClearAll}
          >
            Tümünü temizle
          </button>
        )}
      </header>

      {error && (
        <div className="bookmarks-message bookmarks-message-error">
          <span>{error}</span>
        </div>
      )}

      {!loading && symbols.length === 0 && !error && (
        <div className="bookmarks-message">
          <span>
            Henüz kaydedilmiş bir varlık yok. Detay sayfasındaki
            işaretleme ikonu ile favorilerinize ekleyebilirsiniz.
          </span>
        </div>
      )}

      {loading && (
        <div className="bookmarks-message">
          <span>Kaydedilenler yükleniyor…</span>
        </div>
      )}

      {!loading && symbols.length > 0 && (
        <section className="bookmarks-list">
          {orderedSymbols.map((symbol) => {
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
        </section>
      )}
    </div>
  );
}

export default BookmarksPage;

