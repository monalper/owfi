import React from 'react';
import { Link } from 'react-router-dom';
import { TbArrowUpRight, TbArrowDownLeft } from 'react-icons/tb';
import CardChart from '../CardChart/CardChart.jsx';
import { SkeletonLine, SkeletonBlock, SkeletonPill } from '../Skeleton/Skeleton.jsx';
import './AssetCard.css';

const formatterNumber = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function AssetCardSkeleton() {
  return (
    <div className="asset-card-skeleton-root">
      <div className="asset-card-skeleton-inner">
        <div className="asset-card-skeleton-header">
          <SkeletonLine className="asset-card-skeleton-symbol" />
          <SkeletonLine className="asset-card-skeleton-name" />
        </div>

        <div className="asset-card-skeleton-body">
          <SkeletonBlock className="asset-card-skeleton-price" />
          <div className="asset-card-skeleton-change-row">
            <SkeletonPill className="asset-card-skeleton-change-pill" />
            <SkeletonLine className="asset-card-skeleton-change-text" />
          </div>
        </div>
      </div>

      <div className="asset-card-chart-container">
        <div className="asset-card-chart-placeholder">
          <div className="asset-card-chart-placeholder-inner skeleton-chart-inner">
            <SkeletonBlock className="asset-card-chart-placeholder-line" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetCard({
  symbol,
  longName,
  shortName,
  regularMarketPrice,
  change,
  changePercent,
  chartData,
}) {
  const hasName = Boolean(symbol && (longName || shortName));
  const hasPrice = typeof regularMarketPrice === 'number';
  const hasChange = typeof change === 'number';
  const hasChangePercent = typeof changePercent === 'number';
  const hasChartData = Array.isArray(chartData) && chartData.length > 0;
  const isCardReady =
    hasName && hasPrice && hasChange && hasChangePercent && hasChartData;

  if (!isCardReady) {
    return <AssetCardSkeleton />;
  }

  const isPositive = change >= 0;
  const isNegative = change < 0;

  const upperSymbol = (symbol || '').toUpperCase();
  let displaySymbol = upperSymbol.replace(/\.IS$/i, '');

  if (upperSymbol === 'USDTRY=X') displaySymbol = 'USD/TRY';
  else if (upperSymbol === 'EURTRY=X') displaySymbol = 'EUR/TRY';
  else if (upperSymbol === 'EURUSD=X') displaySymbol = 'EUR/USD';
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

  const textChangePercent = formatterNumber.format(Math.abs(changePercent));

  const formattedPrice = formatterNumber.format(regularMarketPrice);
  const priceParts = formattedPrice.split(',');
  const priceMain = priceParts[0];
  const priceDecimal = priceParts.length > 1 ? priceParts[1] : null;

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
        <CardChart
          data={chartData}
          color={isPositive ? '#30d158' : isNegative ? '#ff453a' : '#888888'}
          chartId={symbol}
        />
      </div>
    </Link>
  );
}

export default AssetCard;
