import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowUp, FaArrowDown, FaCoins, FaRegGem, FaDollarSign } from 'react-icons/fa';
import './AssetCard.css';

const formatterPrice = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatterPercent = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function AssetCard({ symbol, longName, shortName, regularMarketPrice, change, changePercent }) {
  const isPositive = typeof change === 'number' && change >= 0;
  const isNegative = typeof change === 'number' && change < 0;

  const upperSymbol = (symbol || '').toUpperCase();

  let displaySymbol = upperSymbol.replace(/\.IS$/i, '');
  if (upperSymbol === 'XAUUSD=X') {
    displaySymbol = 'Altın';
  } else if (upperSymbol === 'XAGUSD=X') {
    displaySymbol = 'Gümüş';
  }

  const isTurkeyIndex =
    upperSymbol === 'XU100.IS' || upperSymbol === 'XU050.IS' || upperSymbol === 'XU030.IS';
  const isAmericaIndex = upperSymbol === 'SPY' || upperSymbol === 'QQQ';
  const isGold = upperSymbol === 'XAUUSD=X';
  const isSilver = upperSymbol === 'XAGUSD=X';
  const isFx = upperSymbol.endsWith('=X') && !isGold && !isSilver;

  let avatarIconSrc = null;
  if (isTurkeyIndex) {
    avatarIconSrc = '/cardicon/turkey.png';
  } else if (isAmericaIndex) {
    avatarIconSrc = '/cardicon/america.png';
  }

  let AvatarIcon = null;
  if (isGold) {
    AvatarIcon = FaCoins;
  } else if (isSilver) {
    AvatarIcon = FaRegGem;
  } else if (isFx) {
    AvatarIcon = FaDollarSign;
  }

  const avatarClassNames = ['asset-card-avatar'];
  if (isGold) avatarClassNames.push('asset-card-avatar-gold');
  if (isSilver) avatarClassNames.push('asset-card-avatar-silver');
  if (isFx) avatarClassNames.push('asset-card-avatar-fx');

  const textChangePercent =
    typeof changePercent === 'number'
      ? formatterPercent.format(Math.abs(changePercent))
      : null;

  return (
    <Link to={`/asset/${encodeURIComponent(symbol)}`} className="asset-card-root">
      <div className={avatarClassNames.join(' ')}>
        {avatarIconSrc ? (
          <img src={avatarIconSrc} alt="" className="asset-card-avatar-img" />
        ) : AvatarIcon ? (
          <AvatarIcon className="asset-card-avatar-icon" />
        ) : (
          <span>{symbol?.[0] ?? '?'}</span>
        )}
      </div>
      <div className="asset-card-content">
        <div className="asset-card-row asset-card-row-top">
          <div className="asset-card-symbol">{displaySymbol}</div>
          <div className="asset-card-price">
            {typeof regularMarketPrice === 'number'
              ? formatterPrice.format(regularMarketPrice)
              : '—'}
          </div>
        </div>
        <div className="asset-card-row asset-card-row-bottom">
          <div className="asset-card-name">{longName || shortName}</div>
          <div className="asset-card-change">
            {isPositive && (
              <>
                <FaArrowUp className="asset-card-change-icon asset-card-change-icon-positive" />
                <span className="asset-card-change-text asset-card-change-text-positive">
                  %{textChangePercent}
                </span>
              </>
            )}
            {isNegative && (
              <>
                <FaArrowDown className="asset-card-change-icon asset-card-change-icon-negative" />
                <span className="asset-card-change-text asset-card-change-text-negative">
                  %{textChangePercent}
                </span>
              </>
            )}
            {!isPositive && !isNegative && (
              <span className="asset-card-change-text asset-card-change-text-muted">—</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default AssetCard;
