import React, { useEffect, useMemo, useState } from 'react';
import AssetCard from '../../components/AssetCard/AssetCard.jsx';
import SavedListCard from '../../components/SavedListCard/SavedListCard.jsx';
import { fetchChart, fetchQuotes } from '../../api/yahooClient.js';
import { PRESET_LISTS } from '../../config/lists.js';
import {
  getBookmarkedSymbols,
  setBookmarkedSymbols,
} from '../../utils/bookmarksStorage.js';
import {
  getBookmarkedListIds,
  setBookmarkedListIds,
} from '../../utils/listBookmarksStorage.js';
import { FaTrash } from 'react-icons/fa';
import { usePageMetaTitle } from '../../utils/pageMeta.js';

import './BookmarksPage.css';

function BookmarksPage() {
  const [assetSymbols, setAssetSymbols] = useState([]);
  const [listIds, setListIds] = useState([]);
  const [quotes, setQuotes] = useState({});
  const [charts, setCharts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [layoutType, setLayoutType] = useState('grid'); // grid | compact | list
  const [deleteMode, setDeleteMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  usePageMetaTitle('Kaydedilenler | Openwall Finance');

  useEffect(() => {
    const initialAssets = getBookmarkedSymbols();
    const initialLists = getBookmarkedListIds();
    setAssetSymbols(initialAssets);
    setListIds(initialLists);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const hasAnyBookmarks =
        assetSymbols.length > 0 || listIds.length > 0;

      if (!hasAnyBookmarks) {
        setQuotes({});
        setCharts({});
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const listSymbols = PRESET_LISTS
          .filter((item) => listIds.includes(item.id))
          .flatMap((item) => item.symbols || []);

        const allSymbols = Array.from(
          new Set([...assetSymbols, ...listSymbols]),
        );

        if (!allSymbols.length) {
          setQuotes({});
          setCharts({});
          setLoading(false);
          setError(null);
          return;
        }

        const result = await fetchQuotes(allSymbols);
        if (cancelled) return;

        const bySymbol = {};
        result.forEach((item) => {
          if (item?.symbol) {
            bySymbol[item.symbol] = item;
          }
        });
        setQuotes(bySymbol);

        const chartEntries = await Promise.all(
          assetSymbols.map(async (symbol) => {
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
          setError(err.message || 'Kaydedilenler yüklenirken bir hata oluştu.');
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
  }, [assetSymbols, listIds]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('bookmarks:deleteModeChanged', {
        detail: { deleteMode },
      }),
    );
  }, [deleteMode]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleOpenSettingsEvent = () => {
      setDeleteMode(false);
      setIsSettingsOpen(true);
    };

    const handleSaveChangesEvent = () => {
      setDeleteMode(false);
      setIsSettingsOpen(true);
    };

    window.addEventListener('bookmarks:openSettings', handleOpenSettingsEvent);
    window.addEventListener('bookmarks:saveChanges', handleSaveChangesEvent);

    return () => {
      window.removeEventListener('bookmarks:openSettings', handleOpenSettingsEvent);
      window.removeEventListener('bookmarks:saveChanges', handleSaveChangesEvent);
    };
  }, []);

  const handleClearAll = () => {
    setBookmarkedSymbols([]);
    setBookmarkedListIds([]);
    setAssetSymbols([]);
    setListIds([]);
    setDeleteMode(false);
  };

  const handleDeleteSymbol = (symbol) => {
    const updated = assetSymbols.filter((s) => s !== symbol);
    setBookmarkedSymbols(updated);
    setAssetSymbols(updated);
  };

  const handleDeleteList = (listId) => {
    const updated = listIds.filter((id) => id !== listId);
    setBookmarkedListIds(updated);
    setListIds(updated);
  };

  const orderedSymbols = useMemo(
    () => assetSymbols.slice().sort((a, b) => a.localeCompare(b)),
    [assetSymbols],
  );

  const bookmarkedLists = useMemo(
    () =>
      listIds
        .map((id) => PRESET_LISTS.find((item) => item.id === id))
        .filter(Boolean),
    [listIds],
  );

  const listClassName = `bookmarks-list bookmarks-list--${layoutType}`;

  const closeSettings = () => setIsSettingsOpen(false);

  const handleToggleDeleteMode = () => {
    setDeleteMode((prev) => {
      const next = !prev;
      if (next) {
        setIsSettingsOpen(false);
      }
      return next;
    });
  };

  const handleSelectLayout = (type) => {
    setLayoutType(type);
  };

  const layoutOptionsClassName = `bookmarks-settings-layout-options bookmarks-settings-layout-options--${layoutType}`;

  return (
    <div className="bookmarks-root">
      <header className="bookmarks-header">
        <h1 className="bookmarks-title"></h1>
      </header>

      {error && (
        <div className="bookmarks-message bookmarks-message-error">
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="bookmarks-message">
          <span>Kaydedilenler yükleniyor...</span>
        </div>
      )}

      {!loading && bookmarkedLists.length > 0 && (
        <section className="bookmarks-lists-section">
          <h2 className="bookmarks-lists-title"></h2>
          <div className="bookmarks-lists-grid">
            {bookmarkedLists.map((list) => (
              <div
                key={list.id}
                className={`bookmarks-item-wrapper${
                  deleteMode ? ' bookmarks-item-wrapper--deleting' : ''
                }`}
              >
                {deleteMode && (
                  <>
                    <button
                      type="button"
                      className="bookmarks-item-delete-button"
                      onClick={() => handleDeleteList(list.id)}
                      aria-label={`${list.title} kaydını sil`}
                    >
                      <FaTrash />
                    </button>
                    <div className="bookmarks-item-blocker" />
                  </>
                )}
                <SavedListCard list={list} quotesBySymbol={quotes} />
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && assetSymbols.length > 0 && (
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
                  <>
                    <button
                      type="button"
                      className="bookmarks-item-delete-button"
                      onClick={() => handleDeleteSymbol(symbol)}
                      aria-label={`${symbol} kaydını sil`}
                    >
                      <FaTrash />
                    </button>
                    <div className="bookmarks-item-blocker" />
                  </>
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
                aria-label="Kapat"
              >
                ×
              </button>
            </div>

            <div className="bookmarks-settings-section">
              <div className="bookmarks-settings-section-title">
                Görünüm
              </div>
              <div className={layoutOptionsClassName}>
                <div className="bookmarks-settings-layout-indicator" />
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
                  Sıkı grid
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
                <button
                  type="button"
                  className={`bookmarks-toggle-button${
                    deleteMode ? ' bookmarks-toggle-button--active' : ''
                  }`}
                  onClick={handleToggleDeleteMode}
                >
                  Tek tek silme modu
                </button>
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
    </div>
  );
}

export default BookmarksPage;

