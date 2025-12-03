import React, { useEffect, useMemo, useState } from 'react';
import AssetCard from '../../components/AssetCard/AssetCard.jsx';
import { fetchChart, fetchQuotes } from '../../api/yahooClient.js';
import {
  getBookmarkedSymbols,
  setBookmarkedSymbols,
} from '../../utils/bookmarksStorage.js';

import { FaArrowDown, FaArrowUp } from 'react-icons/fa6';

import './BookmarksPage.css';

function BookmarksPage() {
  const [symbols, setSymbols] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [charts, setCharts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [layoutType, setLayoutType] = useState('grid'); // grid | compact | list
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
          if (item?.symbol) bySymbol[item.symbol] = item;
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
          })
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
        if (!cancelled) setLoading(false);
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
    [symbols]
  );

  const toggleDropdown = () => setDropdownOpen((x) => !x);

  const selectLayout = (type) => {
    setLayoutType(type);
    setDropdownOpen(false);
  };

  const listClassName = `bookmarks-list bookmarks-list--${layoutType}`;

  return (
    <div className="bookmarks-root">
      <header className="bookmarks-header">
        <h1 className="bookmarks-title">Kaydedilenler</h1>

        {symbols.length > 0 && (
          <div className="bookmarks-actions">

            {/* CUSTOM DROPDOWN */}
            <div className="bookmarks-dropdown-wrapper">
              <button
                type="button"
                className="bookmarks-dropdown-button"
                onClick={toggleDropdown}
              >
                {layoutType === 'grid' && 'Grid'}
                {layoutType === 'compact' && 'Sıkı Grid'}
                {layoutType === 'list' && 'Liste'}

                <span className="bookmarks-dropdown-icon">
                  {dropdownOpen ? <FaArrowUp /> : <FaArrowDown />}
                </span>
              </button>

              {dropdownOpen && (
                <div className="bookmarks-dropdown-menu">
                  <div
                    className="bookmarks-dropdown-item"
                    onClick={() => selectLayout('grid')}
                  >
                    Grid
                  </div>
                  <div
                    className="bookmarks-dropdown-item"
                    onClick={() => selectLayout('compact')}
                  >
                    Sıkı Grid
                  </div>
                  <div
                    className="bookmarks-dropdown-item"
                    onClick={() => selectLayout('list')}
                  >
                    Liste
                  </div>
                </div>
              )}
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

      {loading && (
        <div className="bookmarks-message">
          <span>Kaydedilenler yükleniyor…</span>
        </div>
      )}

      {!loading && symbols.length > 0 && (
        <section className={listClassName}>
          {orderedSymbols.map((symbol) => (
            <AssetCard
              key={symbol}
              symbol={symbol}
              longName={quotes[symbol]?.longName}
              shortName={quotes[symbol]?.shortName}
              regularMarketPrice={quotes[symbol]?.regularMarketPrice}
              change={quotes[symbol]?.regularMarketChange}
              changePercent={quotes[symbol]?.regularMarketChangePercent}
              chartData={charts[symbol]}
            />
          ))}
        </section>
      )}
    </div>
  );
}

export default BookmarksPage;
