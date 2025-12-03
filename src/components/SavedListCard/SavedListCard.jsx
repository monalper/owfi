import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TbArrowLeft,
  TbArrowRight,
  TbArrowUpRight,
  TbArrowDownLeft,
} from 'react-icons/tb';
import './SavedListCard.css';

const priceFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getDisplaySymbol(symbol) {
  if (!symbol) return '';
  const upper = String(symbol).toUpperCase();

  if (upper === 'USDTRY=X') return 'USD/TRY';
  if (upper === 'EURTRY=X') return 'EUR/TRY';
  if (upper === 'EURUSD=X') return 'EUR/USD';

  return upper.replace(/\.IS$/i, '');
}

function getMarketLabel(market) {
  if (market === 'bist') return 'BIST Liste';
  if (market === 'us') return 'ABD Liste';
  if (market === 'funds') return 'Fon Liste';
  if (market === 'other') return 'Global Liste';
  return 'Liste';
}

function computeAggregateMetrics(symbols, quotesBySymbol) {
  let totalPrice = 0;
  let totalChange = 0;
  let totalPrevious = 0;

  symbols.forEach((symbol) => {
    const quote = quotesBySymbol[symbol];

    const price =
      quote && typeof quote.regularMarketPrice === 'number'
        ? quote.regularMarketPrice
        : null;

    const change =
      quote && typeof quote.regularMarketChange === 'number'
        ? quote.regularMarketChange
        : null;

    if (typeof price !== 'number' || typeof change !== 'number') {
      return;
    }

    const previous = price - change;

    totalPrice += price;
    totalChange += change;

    if (previous > 0) {
      totalPrevious += previous;
    }
  });

  const hasData = totalPrice > 0;

  const totalChangePercent =
    hasData && totalPrevious > 0
      ? (totalChange / totalPrevious) * 100
      : null;

  return {
    hasData,
    totalPrice,
    totalChange,
    totalChangePercent,
  };
}

function SavedListCard({ list, quotesBySymbol, pageSize = 7 }) {
  const navigate = useNavigate();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageDirection, setPageDirection] = useState('next'); // 'next' | 'prev'

  const symbols = Array.isArray(list.symbols) ? list.symbols : [];

  const rowPages = useMemo(() => {
    if (!symbols.length) return [];

    const chunks = [];
    for (let i = 0; i < symbols.length; i += pageSize) {
      chunks.push(symbols.slice(i, i + pageSize));
    }
    return chunks;
  }, [symbols, pageSize]);

  const totalPages = rowPages.length + 1; // 0: özet, 1..N: satır sayfaları
  const currentPageSymbols =
    pageIndex === 0
      ? []
      : rowPages[Math.min(pageIndex - 1, rowPages.length - 1)] || [];

  const aggregate = useMemo(
    () => computeAggregateMetrics(symbols, quotesBySymbol),
    [symbols, quotesBySymbol],
  );

  const isPositive =
    typeof aggregate.totalChange === 'number' && aggregate.totalChange > 0;
  const isNegative =
    typeof aggregate.totalChange === 'number' && aggregate.totalChange < 0;

  // Swipe için ref'ler
  const touchStartXRef = useRef(null);
  const swipeLockRef = useRef(false);
  const minSwipeDistance = 60; // px

  const goPrevPage = () => {
    setPageDirection('prev');
    setPageIndex((prev) => Math.max(prev - 1, 0));
  };

  const goNextPage = () => {
    setPageDirection('next');
    setPageIndex((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const handleCardClick = () => {
    // Eğer bu tap'ten hemen önce bir swipe ile sayfa değiştiysek, navigate etme
    if (swipeLockRef.current) {
      swipeLockRef.current = false;
      return;
    }
    navigate(`/lists/${list.id}`);
  };

  const handlePrev = (event) => {
    event.stopPropagation();
    if (pageIndex === 0) return;
    goPrevPage();
  };

  const handleNext = (event) => {
    event.stopPropagation();
    if (pageIndex === totalPages - 1) return;
    goNextPage();
  };

  const handleDotClick = (event, index) => {
    event.stopPropagation();
    if (index === pageIndex) return;

    setPageDirection(index > pageIndex ? 'next' : 'prev');
    setPageIndex(index);
  };

  const handleTouchStart = (event) => {
    if (event.changedTouches && event.changedTouches.length > 0) {
      touchStartXRef.current = event.changedTouches[0].clientX;
    }
  };

  const handleTouchEnd = (event) => {
    if (
      !event.changedTouches ||
      event.changedTouches.length === 0 ||
      touchStartXRef.current == null
    ) {
      return;
    }

    const endX = event.changedTouches[0].clientX;
    const distance = endX - touchStartXRef.current;

    if (Math.abs(distance) < minSwipeDistance) {
      return;
    }

    // swipe var → click ile navigate olmasın
    swipeLockRef.current = true;

    if (distance < 0 && pageIndex < totalPages - 1) {
      // sola kaydır → sonraki sayfa
      goNextPage();
    } else if (distance > 0 && pageIndex > 0) {
      // sağa kaydır → önceki sayfa
      goPrevPage();
    }
  };

  const marketLabel = getMarketLabel(list.market);

  // Sayfa içeriğini tek yerde topluyoruz (animasyon için)
  const renderPageContent = () => {
    if (pageIndex === 0) {
      return (
        <div className="saved-list-card-summary">
          <div className="saved-list-card-summary-price">
            {aggregate.hasData ? (
              (() => {
                const formatted = priceFormatter.format(aggregate.totalPrice);
                const [main, decimal] = formatted.split(',');
                return (
                  <>
                    <span className="saved-list-card-summary-price-main">
                      {main}
                    </span>
                    {decimal && (
                      <span className="saved-list-card-summary-price-decimal">
                        ,{decimal}
                      </span>
                    )}
                  </>
                );
              })()
            ) : (
              <span className="saved-list-card-summary-price-main">--</span>
            )}
          </div>
          <div className="saved-list-card-summary-change">
            {aggregate.hasData &&
            typeof aggregate.totalChange === 'number' ? (
              <>
                {isPositive && (
                  <TbArrowUpRight className="saved-list-card-summary-change-icon saved-list-card-summary-change-icon-positive" />
                )}
                {isNegative && (
                  <TbArrowDownLeft className="saved-list-card-summary-change-icon saved-list-card-summary-change-icon-negative" />
                )}
                <span
                  className={`saved-list-card-summary-change-value${
                    isPositive
                      ? ' saved-list-card-summary-change-value-positive'
                      : isNegative
                      ? ' saved-list-card-summary-change-value-negative'
                      : ''
                  }`}
                >
                  {priceFormatter.format(Math.abs(aggregate.totalChange))}
                </span>
                {typeof aggregate.totalChangePercent === 'number' && (
                  <span
                    className={`saved-list-card-summary-change-percent${
                      isPositive
                        ? ' saved-list-card-summary-change-value-positive'
                        : isNegative
                        ? ' saved-list-card-summary-change-value-negative'
                        : ''
                    }`}
                  >
                    %{percentFormatter.format(
                      Math.abs(aggregate.totalChangePercent),
                    )}
                  </span>
                )}
              </>
            ) : (
              <span className="saved-list-card-summary-change-muted">--</span>
            )}
          </div>
        </div>
      );
    }

    // Satır sayfaları
    return currentPageSymbols.map((symbol) => {
      const quote = quotesBySymbol[symbol];
      const price = quote?.regularMarketPrice;
      const changePercent = quote?.regularMarketChangePercent;

      const rowPositive =
        typeof changePercent === 'number' && changePercent > 0;
      const rowNegative =
        typeof changePercent === 'number' && changePercent < 0;

      const formattedPrice =
        typeof price === 'number' ? priceFormatter.format(price) : '--';

      const formattedChange =
        typeof changePercent === 'number'
          ? `${changePercent >= 0 ? '+' : '-'}${percentFormatter.format(
              Math.abs(changePercent),
            )}%`
          : '--';

      const hasAnyData =
        typeof price === 'number' || typeof changePercent === 'number';

      return (
        <div
          key={symbol}
          className={`saved-list-card-row${
            rowPositive
              ? ' saved-list-card-row-positive'
              : rowNegative
              ? ' saved-list-card-row-negative'
              : ''
          }`}
        >
          <div className="saved-list-card-row-left">
            <div className="saved-list-card-row-symbol">
              {getDisplaySymbol(symbol)}
            </div>
            {quote?.shortName && (
              <div className="saved-list-card-row-name">
                {quote.shortName}
              </div>
            )}
          </div>

          <div className="saved-list-card-row-right">
            <span
              className={`saved-list-card-row-price${
                rowPositive
                  ? ' saved-list-card-row-price-positive'
                  : rowNegative
                  ? ' saved-list-card-row-price-negative'
                  : ''
              }`}
            >
              {formattedPrice}
            </span>

            <div
              className={`saved-list-card-row-badge${
                rowPositive
                  ? ' saved-list-card-row-badge-positive'
                  : rowNegative
                  ? ' saved-list-card-row-badge-negative'
                  : ''
              }`}
            >
              {rowPositive && (
                <TbArrowUpRight className="saved-list-card-row-badge-icon" />
              )}
              {rowNegative && (
                <TbArrowDownLeft className="saved-list-card-row-badge-icon" />
              )}
              <span className="saved-list-card-row-badge-text">
                {hasAnyData ? formattedChange : 'Veri yok'}
              </span>
            </div>
          </div>
        </div>
      );
    });
  };

  const pageAnimationClass =
    pageDirection === 'next'
      ? 'saved-list-card-page-enter-from-right'
      : 'saved-list-card-page-enter-from-left';

  return (
    <div
      className="saved-list-card-root"
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleCardClick();
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <header className="saved-list-card-header">
        <div className="saved-list-card-icon-wrapper">
          {list.iconImage ? (
            <img
              src={list.iconImage}
              alt=""
              className="saved-list-card-icon-image"
              aria-hidden="true"
            />
          ) : (
            <span className="saved-list-card-icon" aria-hidden="true">
              {list.emoji}
            </span>
          )}
        </div>
        <div className="saved-list-card-header-text">
          <div className="saved-list-card-title">{list.title}</div>
          <div className="saved-list-card-subtitle">{marketLabel}</div>
        </div>
      </header>

      <div className="saved-list-card-body">
        <div
          key={pageIndex}
          className={`saved-list-card-page ${pageAnimationClass}`}
        >
          {renderPageContent()}
        </div>
      </div>

      {totalPages > 1 && (
        <footer className="saved-list-card-footer">
          <button
            type="button"
            className="saved-list-card-nav-button"
            onClick={handlePrev}
            disabled={pageIndex === 0}
            aria-label="Önceki sayfa"
          >
            <TbArrowLeft />
          </button>

          <div className="saved-list-card-dots">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                type="button"
                className={`saved-list-card-dot${
                  index === pageIndex ? ' saved-list-card-dot-active' : ''
                }`}
                onClick={(event) => handleDotClick(event, index)}
                aria-label={
                  index === 0
                    ? 'Özet sayfaya git'
                    : `${index}. sayfaya git`
                }
              />
            ))}
          </div>

          <button
            type="button"
            className="saved-list-card-nav-button"
            onClick={handleNext}
            disabled={pageIndex === totalPages - 1}
            aria-label="Sonraki sayfa"
          >
            <TbArrowRight />
          </button>
        </footer>
      )}
    </div>
  );
}

export default SavedListCard;
