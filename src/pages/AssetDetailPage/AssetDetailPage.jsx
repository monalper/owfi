import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { fetchChart, fetchQuotes } from '../../api/yahooClient.js';
import AssetChart from '../../components/AssetChart/AssetChart.jsx';
import TimeRangeToggle from '../../components/TimeRangeToggle/TimeRangeToggle.jsx';
import './AssetDetailPage.css';

const priceFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function AssetDetailPage() {
  const { symbol } = useParams();

  const [rangeKey, setRangeKey] = useState('1G');
  const [quote, setQuote] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loadingQuote, setLoadingQuote] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [error, setError] = useState(null);

  // Özet Bilgiler sekmeleri için
  const [metricsTab, setMetricsTab] = useState('daily'); // 'daily' | '52w'

  // Focus / tıklanma efektlerini temizlemek için ref
  const pageRef = useRef(null);
  const chartContainerRef = useRef(null);

  // Sayfa yüklendiğinde grafik alanı otomatik seçili gelmesin diye
  useEffect(() => {
    const active = document.activeElement;
    if (
      active instanceof HTMLElement &&
      chartContainerRef.current &&
      chartContainerRef.current.contains(active)
    ) {
      active.blur();
    }
  }, []);

  // Dışarı tıklanınca varsa focus/tıklanma efektini temizle
  useEffect(() => {
    function handlePointerDown(event) {
      const active = document.activeElement;

      if (!active || active === document.body) return;

      // Tıklanan yer aktif elementin içindeyse dokunma
      if (active instanceof HTMLElement && active.contains(event.target)) {
        return;
      }

      // Sayfa içinde focuslanmış bir şey varsa blurluyoruz
      if (
        active instanceof HTMLElement &&
        pageRef.current &&
        pageRef.current.contains(active)
      ) {
        active.blur();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadQuote() {
      try {
        setLoadingQuote(true);
        const result = await fetchQuotes([symbol]);
        if (cancelled) return;
        setQuote(result[0] || null);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Varlık bilgisi alınamadı.');
      } finally {
        if (!cancelled) setLoadingQuote(false);
      }
    }

    loadQuote();

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  useEffect(() => {
    let cancelled = false;

    async function loadChart() {
      try {
        setLoadingChart(true);
        const data = await fetchChart(symbol, rangeKey);
        if (cancelled) return;
        setChartData(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Grafik verisi alınamadı.');
      } finally {
        if (!cancelled) setLoadingChart(false);
      }
    }

    loadChart();

    return () => {
      cancelled = true;
    };
  }, [symbol, rangeKey]);

  const rawSymbol = symbol || '';
  const upperSymbol = rawSymbol.toUpperCase();

  let displaySymbol = upperSymbol.replace(/\.IS$/i, '');
  if (upperSymbol === 'XAUUSD=X') {
    displaySymbol = 'Altın';
  } else if (upperSymbol === 'XAGUSD=X') {
    displaySymbol = 'Gümüş';
  }

  const change = quote?.regularMarketChange;
  const changePercent = quote?.regularMarketChangePercent;

  const isPositive = typeof change === 'number' && change >= 0;
  const isNegative = typeof change === 'number' && change < 0;

  const formatPriceOrDash = (val) =>
    typeof val === 'number' ? priceFormatter.format(val) : '—';

  const formatIntOrDash = (val) =>
    typeof val === 'number' ? val.toLocaleString('tr-TR') : '—';

  const metricsDaily = [
    {
      key: 'dayHigh',
      label: 'Günlük En Yüksek',
      value: formatPriceOrDash(quote?.regularMarketDayHigh),
    },
    {
      key: 'dayLow',
      label: 'Günlük En Düşük',
      value: formatPriceOrDash(quote?.regularMarketDayLow),
    },
    {
      key: 'volume',
      label: 'Hacim',
      value: formatIntOrDash(quote?.regularMarketVolume),
    },
    {
      key: 'marketCap',
      label: 'Piyasa Değeri',
      value: formatIntOrDash(quote?.marketCap),
    },
  ];

  const metrics52w = [
    {
      key: '52wHigh',
      label: '52 Hafta En Yüksek',
      value: formatPriceOrDash(quote?.fiftyTwoWeekHigh),
    },
    {
      key: '52wLow',
      label: '52 Hafta En Düşük',
      value: formatPriceOrDash(quote?.fiftyTwoWeekLow),
    },
  ];

  const currentMetrics = metricsTab === 'daily' ? metricsDaily : metrics52w;

  return (
    <div className="asset-detail-root" ref={pageRef}>
      {error && (
        <div className="asset-detail-error">
          <span>{error}</span>
        </div>
      )}

      <section className="asset-detail-header">
        <div className="asset-detail-header-main">
          <div className="asset-detail-header-text">
            <h1 className="asset-detail-symbol">{displaySymbol}</h1>
            <p className="asset-detail-name">
              {quote?.longName || quote?.shortName || 'Varlık bilgisi yükleniyor'}
            </p>
          </div>
        </div>
        <div className="asset-detail-price-block">
          <div className="asset-detail-price">
            {typeof quote?.regularMarketPrice === 'number'
              ? priceFormatter.format(quote.regularMarketPrice)
              : '—'}
          </div>
          <div className="asset-detail-change-row">
            {isPositive && (
              <>
                <FaArrowUp className="asset-detail-change-icon asset-detail-change-icon-positive" />
                <span className="asset-detail-change-value asset-detail-change-value-positive">
                  {priceFormatter.format(Math.abs(change))}
                </span>
                <span className="asset-detail-change-percent asset-detail-change-value-positive">
                  %{percentFormatter.format(Math.abs(changePercent))}
                </span>
              </>
            )}
            {isNegative && (
              <>
                <FaArrowDown className="asset-detail-change-icon asset-detail-change-icon-negative" />
                <span className="asset-detail-change-value asset-detail-change-value-negative">
                  {priceFormatter.format(Math.abs(change))}
                </span>
                <span className="asset-detail-change-percent asset-detail-change-value-negative">
                  %{percentFormatter.format(Math.abs(changePercent))}
                </span>
              </>
            )}
            {!isPositive && !isNegative && (
              <span className="asset-detail-change-muted">—</span>
            )}
          </div>
        </div>
      </section>

      <section className="asset-detail-chart-section">
        <div className="asset-detail-chart-header">
          <h2 className="asset-detail-chart-title"></h2>
          <div className="asset-detail-chart-toggle-desktop">
            <TimeRangeToggle value={rangeKey} onChange={setRangeKey} />
          </div>
        </div>
        <div className="asset-detail-chart-card" ref={chartContainerRef}>
          {loadingChart ? (
            <div className="asset-detail-loading">Grafik yükleniyor…</div>
          ) : null}
          {!loadingChart && <AssetChart data={chartData} />}
        </div>
        <div className="asset-detail-chart-toggle-mobile">
          <TimeRangeToggle value={rangeKey} onChange={setRangeKey} />
        </div>
      </section>

      <section className="asset-detail-metrics">
        <div className="asset-detail-metrics-header">
          <h2 className="asset-detail-metrics-title">Özet Bilgiler</h2>
        </div>

        {/* Tab navbar */}
        <div className="asset-detail-metrics-tabs">
          <button
            type="button"
            className={`asset-detail-metrics-tab ${
              metricsTab === 'daily' ? 'asset-detail-metrics-tab--active' : ''
            }`}
            onClick={() => setMetricsTab('daily')}
          >
            Günlük
          </button>
          <button
            type="button"
            className={`asset-detail-metrics-tab ${
              metricsTab === '52w' ? 'asset-detail-metrics-tab--active' : ''
            }`}
            onClick={() => setMetricsTab('52w')}
          >
            52 Hafta
          </button>
        </div>

        <div className="asset-detail-metrics-grid">
          {currentMetrics.map((metric) => (
            <div key={metric.key} className="asset-detail-metric">
              <span className="asset-detail-metric-label">{metric.label}</span>
              <span className="asset-detail-metric-value">{metric.value}</span>
            </div>
          ))}
        </div>
      </section>

      {loadingQuote && (
        <div className="asset-detail-loading">
          <span>Veriler yükleniyor…</span>
        </div>
      )}
    </div>
  );
}

export default AssetDetailPage;
