import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { RiBookmarkLine, RiBookmarkFill } from 'react-icons/ri';
import { PRESET_LISTS } from '../../config/lists.js';
import { fetchQuotes, fetchChart } from '../../api/yahooClient.js';
import AssetCard from '../../components/AssetCard/AssetCard.jsx';
import { usePageMetaTitle } from '../../utils/pageMeta.js';
import {
  isListBookmarked,
  toggleListBookmark,
} from '../../utils/listBookmarksStorage.js';
import './ListDetailPage.css';

function ListDetailPage() {
  const { listId } = useParams();

  const list = useMemo(
    () => PRESET_LISTS.find((item) => item.id === listId),
    [listId],
  );

  const symbols = list?.symbols ?? [];

  const [quotes, setQuotes] = useState({});
  const [charts, setCharts] = useState({});
  const [loading, setLoading] = useState(symbols.length > 0);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!list || symbols.length === 0) {
        setQuotes({});
        setCharts({});
        setLoading(false);
        setError(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const quoteResult = await fetchQuotes(symbols);
        if (cancelled) return;

        const quotesBySymbol = {};
        quoteResult.forEach((item) => {
          quotesBySymbol[item.symbol] = item;
        });
        setQuotes(quotesBySymbol);

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

        const chartsBySymbol = {};
        chartEntries.forEach(([symbol, data]) => {
          chartsBySymbol[symbol] = data;
        });
        setCharts(chartsBySymbol);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Veriler yüklenirken bir hata oluştu.');
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
  }, [list, symbols]);

  useEffect(() => {
    if (!list) {
      setIsBookmarked(false);
      return;
    }

    setIsBookmarked(isListBookmarked(list.id));
  }, [list]);

  const pageTitle = list?.title
    ? `${list.title} | Openwall Finance`
    : 'Listeler | Openwall Finance';

  usePageMetaTitle(pageTitle);

  if (!list) {
    return (
      <div className="list-detail-root">
        <div className="list-detail-error">
          Böyle bir liste bulunamadı.
        </div>
      </div>
    );
  }

  const hasSymbols = symbols.length > 0;

  const handleBookmarkClick = () => {
    if (!list) return;
    const next = toggleListBookmark(list.id);
    setIsBookmarked(next);
  };

  return (
    <div className="list-detail-root">
      <header className="list-detail-header">
        <div className="list-detail-header-main">
          <div className="list-detail-icon-wrapper">
            {list.iconImage ? (
              <img
                src={list.iconImage}
                alt=""
                className="list-detail-icon-image"
                aria-hidden="true"
              />
            ) : (
              <span className="list-detail-icon" aria-hidden="true">
                {list.emoji}
              </span>
            )}
          </div>
          <div className="list-detail-header-text">
            <h1 className="list-detail-title">{list.title}</h1>
            {list.description && (
              <p className="list-detail-description">{list.description}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          className={`list-detail-bookmark-button${
            isBookmarked ? ' list-detail-bookmark-button--active' : ''
          }`}
          onClick={handleBookmarkClick}
          aria-pressed={isBookmarked}
          aria-label={
            isBookmarked
              ? 'Listeyi kaydedilenlerden kaldŽñr'
              : 'Listeyi kaydedilenlere ekle'
          }
        >
          {isBookmarked ? (
            <RiBookmarkFill className="list-detail-bookmark-icon" />
          ) : (
            <RiBookmarkLine className="list-detail-bookmark-icon" />
          )}
        </button>
      </header>

      {error && <div className="list-detail-error">{error}</div>}

      {loading && (
        <div className="list-detail-loading">Veriler yükleniyor...</div>
      )}

      {!loading && !hasSymbols && (
        <div className="list-detail-empty">
          Bu liste için henüz varlık eklenmedi.
        </div>
      )}

      {!loading && hasSymbols && (
        <section className="list-detail-list">
          {symbols.map((symbol) => {
            const quote = quotes[symbol];
            const chartData = charts[symbol] || [];

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

export default ListDetailPage;
