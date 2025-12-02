import React from 'react';
import { Link } from 'react-router-dom';
import { TbArrowUpRight, TbArrowDownLeft } from 'react-icons/tb';
import CardChart from '../CardChart/CardChart.jsx';
import './AssetCard.css';

const formatterNumber = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function AssetCard({
  symbol,
  longName,
  shortName,
  regularMarketPrice,
  change,
  changePercent,
  chartData,
}) {
  const isPositive = typeof change === 'number' && change >= 0;
  const isNegative = typeof change === 'number' && change < 0;

  const upperSymbol = (symbol || '').toUpperCase();
  let displaySymbol = upperSymbol.replace(/\.IS$/i, '');

  // Döviz pariteleri için özel gösterim
  if (upperSymbol === 'USDTRY=X') displaySymbol = 'USD/TRY';
  else if (upperSymbol === 'EURTRY=X') displaySymbol = 'EUR/TRY';
  else if (upperSymbol === 'EURUSD=X') displaySymbol = 'EUR/USD';
  // Kıymetli madenler için özel gösterim
  else if (upperSymbol === 'GC=F') displaySymbol = 'Altın';
  else if (upperSymbol === 'SI=F') displaySymbol = 'Gümüş';

  const isTurkeyIndex = upperSymbol.includes('.IS') || upperSymbol.startsWith('XU');

  const isUsd =
    upperSymbol === 'SPY' ||
    upperSymbol === 'QQQ' ||
    upperSymbol === 'GC=F' ||
    upperSymbol === 'SI=F' ||
    (!upperSymbol.includes('.IS') && !upperSymbol.includes('=X'));

  let currencySymbol = '';
  if (isTurkeyIndex) currencySymbol = '₺';
  else if (isUsd) currencySymbol = '$';

  const textChangePercent =
    typeof changePercent === 'number'
      ? formatterNumber.format(Math.abs(changePercent))
      : null;

  let priceMain = '?';
  let priceDecimal = null;

  if (typeof regularMarketPrice === 'number') {
    const formatted = formatterNumber.format(regularMarketPrice);
    const parts = formatted.split(',');
    priceMain = parts[0];
    if (parts.length > 1) priceDecimal = parts[1];
  }

  return (
    <Link to={`/asset/${encodeURIComponent(symbol)}`} className="asset-card-root">
      <div className="asset-card-content-wrapper">
        <div className="asset-card-header">
          <div className="asset-card-symbol">{displaySymbol}</div>
          <div className="asset-card-name">{longName || shortName}</div>
        </div>

        <div className="asset-card-body">
          <div className="asset-card-price">
            <span className="price-main">{priceMain}</span>
            {priceDecimal && (
              <span className="price-decimal">,{priceDecimal}</span>
            )}
            {currencySymbol && (
              <span className="currency-symbol">{currencySymbol}</span>
            )}
          </div>

          <div className="asset-card-change">
            {isPositive && (
              <>
                <TbArrowUpRight className="asset-card-change-icon positive" />
                <span className="asset-card-change-text positive">
                  %{textChangePercent}
                </span>
              </>
            )}
            {isNegative && (
              <>
                <TbArrowDownLeft className="asset-card-change-icon negative" />
                <span className="asset-card-change-text negative">
                  %{textChangePercent}
                </span>
              </>
            )}
            {!isPositive && !isNegative && (
              <span className="asset-card-change-text muted">--</span>
            )}
          </div>
        </div>
      </div>

      <div className="asset-card-chart-container">
        {Array.isArray(chartData) && chartData.length > 0 ? (
          <CardChart
            data={chartData}
            color={isPositive ? '#30d158' : isNegative ? '#ff453a' : '#888'}
            chartId={symbol}
          />
        ) : (
          <div className="chart-placeholder" />
        )}
      </div>
    </Link>
  );
}

export default AssetCard;
