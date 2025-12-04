import React, { useEffect, useMemo, useState } from 'react';
import { fetchComparisonChange } from '../../api/yahooClient.js';
import TimeRangeToggle from '../TimeRangeToggle/TimeRangeToggle.jsx';

const percentFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const COMPARISON_RANGES = [
  { key: '1A', label: '1A' },
  { key: '3A', label: '3A' },
  { key: 'YTD', label: 'YTD' },
  { key: '1Y', label: '1Y' },
  { key: '3Y', label: '3Y' },
];

const BASE_ASSETS = [
  { id: 'self', symbolKey: 'self', label: null, tone: 'primary' },
  { id: 'gold', symbolKey: 'GC=F', label: 'Altın', tone: 'accent' },
  { id: 'silver', symbolKey: 'SI=F', label: 'Gümüş', tone: 'accent' },
  { id: 'usdtry', symbolKey: 'USDTRY=X', label: 'Dolar', tone: 'accent' },
  { id: 'bist100', symbolKey: 'XU100.IS', label: 'BIST 100', tone: 'accent' },
  { id: 'bitcoin', symbolKey: 'BTC-USD', label: 'Bitcoin', tone: 'accent' },
];

const ICON_CONFIG = {
  self: { src: '/detail/secili.png', alt: 'Seçili varlık' },
  gold: { src: '/detail/altın.png', alt: 'Altın' },
  silver: { src: '/detail/gümüs.png', alt: 'Gümüş' },
  usdtry: { src: '/detail/dolar.png', alt: 'Dolar' },
  bist100: { src: '/detail/bist100.png', alt: 'BIST 100' },
  bitcoin: { src: '/detail/bitcoin.png', alt: 'Bitcoin' },
};

function AssetComparison({ symbol, primaryName }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeRange, setActiveRange] = useState('1Y');

  useEffect(() => {
    let cancelled = false;

    async function loadComparison() {
      const trimmedSymbol = String(symbol ?? '').trim();

      if (!trimmedSymbol) {
        setRows([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const assets = BASE_ASSETS.map((item) => {
          if (item.id === 'self') {
            return {
              ...item,
              symbol: trimmedSymbol,
              label: trimmedSymbol,
              name: primaryName || null,
            };
          }
          return { ...item, symbol: item.symbolKey, name: null };
        });

        const nextRows = [];

        await Promise.all(
          assets.map(async (asset) => {
            const assetSymbol = asset.symbol;
            if (!assetSymbol) return;

            const changes = {};

            await Promise.all(
              COMPARISON_RANGES.map(async (range) => {
                try {
                  const stats = await fetchComparisonChange(
                    assetSymbol,
                    range.key,
                  );
                  changes[range.key] =
                    stats && typeof stats.changePercent === 'number'
                      ? stats.changePercent
                      : null;
                } catch {
                  changes[range.key] = null;
                }
              }),
            );

            if (cancelled) return;

            nextRows.push({
              id: asset.id,
              symbol: assetSymbol,
              label: asset.label,
              tone: asset.tone,
              name: asset.name,
              changes,
            });
          }),
        );

        if (cancelled) return;

        const selfRow = nextRows.find((row) => row.id === 'self');
        const others = nextRows.filter((row) => row.id !== 'self');

        setRows(selfRow ? [selfRow, ...others] : others);
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.message ||
              'Karşılaştırma verileri alınırken hata oluştu.',
          );
          setRows([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadComparison();

    return () => {
      cancelled = true;
    };
  }, [symbol, primaryName]);

  const hasRows = Array.isArray(rows) && rows.length > 0;

  const activeValues = useMemo(() => {
    if (!hasRows) return [];
    return rows.map((row) => {
      const value = row.changes?.[activeRange];
      return {
        ...row,
        value,
      };
    });
  }, [rows, activeRange, hasRows]);

  const maxAbs = useMemo(() => {
    const values = activeValues
      .map((row) =>
        typeof row.value === 'number' ? Math.abs(row.value) : 0,
      )
      .filter((v) => Number.isFinite(v) && v > 0);

    if (!values.length) return 0;
    return Math.max(...values);
  }, [activeValues]);

  if (!symbol) {
    return null;
  }

  if (!hasRows && !loading && !error) {
    return null;
  }

  return (
    <section className="asset-detail-comparison">
      <div className="asset-detail-comparison-header">
        <h2 className="asset-detail-comparison-title">Performans</h2>
        <div className="asset-detail-comparison-ranges">
          <TimeRangeToggle
            value={activeRange}
            onChange={setActiveRange}
            options={COMPARISON_RANGES}
            compact
          />
        </div>
      </div>

      {hasRows && (
        <div className="asset-detail-comparison-list">
          {activeValues.map((row) => {
            const isNumber = typeof row.value === 'number';
            const isPositive = isNumber && row.value > 0;
            const isNegative = isNumber && row.value < 0;

            const abs = isNumber ? Math.abs(row.value) : 0;
            const ratio =
              maxAbs > 0 && abs > 0 ? Math.min(abs / maxAbs, 1) : 0;

            const barClassNames = [
              'asset-detail-comparison-bar-fill',
              row.tone === 'primary'
                ? 'asset-detail-comparison-bar-fill--primary'
                : 'asset-detail-comparison-bar-fill--accent',
              isNegative
                ? 'asset-detail-comparison-bar-fill--negative'
                : '',
            ]
              .filter(Boolean)
              .join(' ');

            const valueClassNames = [
              'asset-detail-comparison-value-text',
              isPositive
                ? 'asset-detail-comparison-value-text--positive'
                : '',
              isNegative
                ? 'asset-detail-comparison-value-text--negative'
                : '',
            ]
              .filter(Boolean)
              .join(' ');

            const iconConfig = ICON_CONFIG[row.id];

            return (
              <div
                key={row.id}
                className="asset-detail-comparison-row"
              >
                <div className="asset-detail-comparison-left">
                  <div
                    className={`asset-detail-comparison-icon asset-detail-comparison-icon--${row.id}`}
                  >
                    {iconConfig && (
                      <img
                        src={iconConfig.src}
                        alt={iconConfig.alt}
                        className="asset-detail-comparison-icon-image"
                        draggable="false"
                      />
                    )}
                  </div>
                  <div className="asset-detail-comparison-labels">
                    <span className="asset-detail-comparison-asset-label">
                      {row.label}
                    </span>
                  </div>
                </div>

                <div className="asset-detail-comparison-center">
                  <div className="asset-detail-comparison-bar-track">
                    <div
                      className={barClassNames}
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                </div>

                <div className="asset-detail-comparison-right">
                  <span className={valueClassNames}>
                    {isNumber
                      ? `%${percentFormatter.format(row.value)}`
                      : '--'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {loading && (
        <div className="asset-detail-loading">
          <span>Karşılaştırma verileri yükleniyor...</span>
        </div>
      )}
      {error && (
        <div className="asset-detail-error">
          <span>{error}</span>
        </div>
      )}
    </section>
  );
}

export default AssetComparison;
