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
  const [layoutType, setLayoutType] = useState('grid'); // grid | compact | list

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

  const handleLayoutChange = (event) => {
    setLayoutType(event.target.value);
  };

  const listClassName = `bookmarks-list bookmarks-list--${layoutType}`;

  return (
    <div className="bookmarks-root">
      <header className="bookmarks-header">
        <div>
          <h1 className="bookmarks-title">Kaydedilenler</h1>
          {/* Eski alt metin kaldırıldı:
              "Favori hisse, fon ve dövizlerinizi tek yerde görün." */}
        </div>

        {symbols.length > 0 && (
          <div className="bookmarks-actions">
            <div className="bookmarks-layout-control">
              <span className="bookmarks-layout-label">Listeleme tipi</span>
              <select
                className="bookmarks-layout-select"
                value={layoutType}
                onChange={handleLayoutChange}
              >
                <option value="grid">Grid</option>
                <option value="compact">Sıkı grid</option>
                <option value="list">Liste</option>
              </select>
            </div>

            <button
              type="button"
              className="bookmarks-clear-button"
              onClick={handleClearAll}
            >
              Tümünü temizle
            </button>
          </div>
        )}
      </header>

      {error && (
        <div className="bookmarks-message bookmarks-message-error">
          <span>{error}</span>
        </div>
      )}

      {/* Boş durum mesajı tamamen kaldırıldı:
          "Henüz kaydedilmiş bir varlık yok..." */}

      {loading && (
        <div className="bookmarks-message">
          <span>Kaydedilenler yükleniyor…</span>
        </div>
      )}

      {!loading && symbols.length > 0 && (
        <section className={listClassName}>
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
