import React, { useEffect, useMemo, useState } from 'react';
import { TbArrowUpRight, TbArrowDownLeft } from 'react-icons/tb';
import './BistIndexBanner.css';

const percentFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const ITEMS = [
  { symbol: 'XU030.IS', label: 'BIST 30' },
  { symbol: 'XU050.IS', label: 'BIST 50' },
  { symbol: 'XU100.IS', label: 'BIST 100' },
];

function BistIndexBanner({ quotes, active }) {
  const [render, setRender] = useState(active);

  useEffect(() => {
    if (active) {
      setRender(true);
      return;
    }

    const timeout = setTimeout(() => {
      setRender(false);
    }, 220);

    return () => clearTimeout(timeout);
  }, [active]);

  const items = useMemo(
    () =>
      ITEMS.map((item) => {
        const quote = quotes?.[item.symbol];
        const change = quote?.regularMarketChange;
        const changePercent = quote?.regularMarketChangePercent;

        const isPositive = typeof change === 'number' && change >= 0;
        const isNegative = typeof change === 'number' && change < 0;

        const percentText =
          typeof changePercent === 'number'
            ? percentFormatter.format(Math.abs(changePercent))
            : null;

        return {
          ...item,
          isPositive,
          isNegative,
          percentText,
        };
      }),
    [quotes],
  );

  if (!render) {
    return null;
  }

  return (
    <div
      className={`bist-banner ${
        active ? 'bist-banner--visible' : 'bist-banner--hidden'
      }`}
    >
      <div className="bist-banner__inner">
        {items.map((item, index) => {
          const hasPercent = typeof item.percentText === 'string';

          return (
            <React.Fragment key={item.symbol}>
              <div className="bist-banner__item">
                <span className="bist-banner__label">{item.label}</span>
                <div className="bist-banner__change">
                  {hasPercent && item.isPositive && (
                    <TbArrowUpRight className="bist-banner__icon bist-banner__icon--positive" />
                  )}
                  {hasPercent && item.isNegative && (
                    <TbArrowDownLeft className="bist-banner__icon bist-banner__icon--negative" />
                  )}
                  {hasPercent && (item.isPositive || item.isNegative) && (
                    <span
                      className={`bist-banner__change-text ${
                        item.isPositive
                          ? 'bist-banner__change-text--positive'
                          : 'bist-banner__change-text--negative'
                      }`}
                    >
                      %{item.percentText}
                    </span>
                  )}
                  {!hasPercent && (
                    <span className="bist-banner__change-text bist-banner__change-text--muted">
                      --
                    </span>
                  )}
                </div>
              </div>
              {index < items.length - 1 && (
                <span className="bist-banner__separator">|</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default BistIndexBanner;
