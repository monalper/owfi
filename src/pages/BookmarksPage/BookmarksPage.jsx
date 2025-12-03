import React, { useEffect, useMemo, useState } from 'react';
import AssetCard from '../../components/AssetCard/AssetCard.jsx';
import { fetchChart, fetchQuotes } from '../../api/yahooClient.js';
import {
  getBookmarkedSymbols,
  setBookmarkedSymbols,
} from '../../utils/bookmarksStorage.js';

import { IoMdSettings } from 'react-icons/io';
import { FaTrash } from 'react-icons/fa';

import './BookmarksPage.css';

function BookmarksPage() {
  const [symbols, setSymbols] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [charts, setCharts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [layoutType, setLayoutType] = useState('grid'); // grid | compact | list
  const [deleteMode, setDeleteMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
          if (item?.symbol) {
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
    setDeleteMode(false);
  };

  const handleDeleteSymbol = (symbol) => {
    const updated = symbols.filter((s) => s !== symbol);
    setBookmarkedSymbols(updated);
    setSymbols(updated);
  };

  const orderedSymbols = useMemo(
    () => symbols.slice().sort((a, b) => a.localeCompare(b)),
    [symbols],
  );

  const listClassName = `bookmarks-list bookmarks-list--${layoutType}`;

  const openSettings = () => {
    // popup açılırken silme modu kapalı olsun
    setDeleteMode(false);
    setIsSettingsOpen(true);
  };

  const closeSettings = () => setIsSettingsOpen(false);

  const handleToggleDeleteMode = () => {
    setDeleteMode((prev) => {
      const next = !prev;
      // silme modu açılırken popup kapansın
      if (next) {
        setIsSettingsOpen(false);
      }
      return next;
    });
  };

  const handleSelectLayout = (type) => {
    setLayoutType(type);
  };

  const handleSaveClick = () => {
    // sağ alttaki kaydet: popup geri açılsın, silme modu kapalı olsun
    setDeleteMode(false);
    setIsSettingsOpen(true);
  };

  return (
    <div className="bookmarks-root">
      <header className="bookmarks-header">
        <h1 className="bookmarks-title">Kaydedilenler</h1>

        <div className="bookmarks-actions">
          <button
            type="button"
            className="bookmarks-settings-button"
            onClick={openSettings}
          >
            <IoMdSettings />
          </button>
        </div>
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
          {orderedSymbols.map((symbol) => {
            const quote = quotes[symbol];
            const chartData = charts[symbol];

            return (
              <div
                key={symbol}
                className={`bookmarks-item-wrapper${
                  deleteMode ? ' bookmarks-item-wrapper--deleting' : ''
                }`}
              >
                {deleteMode && (
                  <button
                    type="button"
                    className="bookmarks-item-delete-button"
                    onClick={() => handleDeleteSymbol(symbol)}
                  >
                    <FaTrash />
                  </button>
                )}
                <AssetCard
                  symbol={symbol}
                  longName={quote?.longName}
                  shortName={quote?.shortName}
                  regularMarketPrice={quote?.regularMarketPrice}
                  change={quote?.regularMarketChange}
                  changePercent={quote?.regularMarketChangePercent}
                  chartData={chartData}
                />
              </div>
            );
          })}
        </section>
      )}

      {/* SETTINGS POPUP */}
      {isSettingsOpen && (
        <div
          className="bookmarks-settings-backdrop"
          onClick={closeSettings}
        >
          <div
            className="bookmarks-settings-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bookmarks-settings-header">
              <h2 className="bookmarks-settings-title">
                Kaydedilenler ayarları
              </h2>
              <button
                type="button"
                className="bookmarks-settings-close"
                onClick={closeSettings}
              >
                ×
              </button>
            </div>

            <div className="bookmarks-settings-section">
              <div className="bookmarks-settings-section-title">
                Görünüm
              </div>
              <div className="bookmarks-settings-layout-options">
                <button
                  type="button"
                  className={`bookmarks-settings-layout-button${
                    layoutType === 'grid'
                      ? ' bookmarks-settings-layout-button--active'
                      : ''
                  }`}
                  onClick={() => handleSelectLayout('grid')}
                >
                  Grid
                </button>
                <button
                  type="button"
                  className={`bookmarks-settings-layout-button${
                    layoutType === 'compact'
                      ? ' bookmarks-settings-layout-button--active'
                      : ''
                  }`}
                  onClick={() => handleSelectLayout('compact')}
                >
                  Sıkı Grid
                </button>
                <button
                  type="button"
                  className={`bookmarks-settings-layout-button${
                    layoutType === 'list'
                      ? ' bookmarks-settings-layout-button--active'
                      : ''
                  }`}
                  onClick={() => handleSelectLayout('list')}
                >
                  Liste
                </button>
              </div>
            </div>

            <div className="bookmarks-settings-section">
              <div className="bookmarks-settings-section-title">
                Silme
              </div>
              <div className="bookmarks-settings-row">
                <label className="bookmarks-toggle">
                  <input
                    type="checkbox"
                    checked={deleteMode}
                    onChange={handleToggleDeleteMode}
                  />
                  <span className="bookmarks-toggle-slider" />
                  <span>Tek tek silme modunu aç</span>
                </label>
              </div>

              <button
                type="button"
                className="bookmarks-settings-clear-all"
                onClick={handleClearAll}
              >
                Tümünü sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SAĞ ALTA KAYDET BUTONU: sadece tek tek silme modu açıkken */}
      {deleteMode && (
        <button
          type="button"
          className="bookmarks-save-fab"
          onClick={handleSaveClick}
        >
          Kaydet
        </button>
      )}
    </div>
  );
}

export default BookmarksPage;
