import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  RiHomeLine,
  RiSearchLine,
  RiInformationLine,
  RiBookmarkLine,
  RiBookmarkFill,
  RiArrowLeftLine,
  RiDownloadLine,
} from 'react-icons/ri';
import {
  isSymbolBookmarked,
  toggleSymbolBookmark,
} from '../../utils/bookmarksStorage.js';
import { toPng } from 'html-to-image';
import './Header.css';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [assetSymbol, setAssetSymbol] = useState(null);
  const [isAssetBookmarked, setIsAssetBookmarked] = useState(false);

  const handleLogoClick = () => navigate('/');
  const handleBackClick = () => navigate(-1);

  useEffect(() => {
    const path = location.pathname || '';
    if (path.startsWith('/asset/')) {
      const raw = decodeURIComponent(path.slice('/asset/'.length));
      setAssetSymbol(raw || null);
    } else {
      setAssetSymbol(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!assetSymbol) {
      setIsAssetBookmarked(false);
      return;
    }
    setIsAssetBookmarked(isSymbolBookmarked(assetSymbol));
  }, [assetSymbol]);

  const handleHeaderBookmarkClick = () => {
    if (!assetSymbol) return;
    const next = toggleSymbolBookmark(assetSymbol);
    setIsAssetBookmarked(next);
  };

  const handleExportClick = () => {
    if (!assetSymbol || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const cardNode = document.querySelector('.asset-detail-export-card');
    if (!(cardNode instanceof HTMLElement)) return;

    const activeRangeNode = document.querySelector('.time-toggle-item-active');
    const activeRangeLabel = activeRangeNode
      ? activeRangeNode.textContent?.trim()
      : null;

    const prevTop = cardNode.style.top;
    const prevLeft = cardNode.style.left;
    const prevOpacity = cardNode.style.opacity;
    const prevVisibility = cardNode.style.visibility;

    cardNode.style.top = '0';
    cardNode.style.left = '0';
    cardNode.style.opacity = '1';
    cardNode.style.visibility = 'visible';

    const exportNow = () => {
      toPng(cardNode, {
        cacheBust: true,
        pixelRatio:
          typeof window.devicePixelRatio === 'number'
            ? window.devicePixelRatio * 2
            : 3,
        skipFonts: true,
        style: {
          borderRadius: 0,
          backgroundColor: '#1d1d1f',
        },
      })
        .then((dataUrl) => {
          const link = document.createElement('a');
          const safeSymbol = (assetSymbol || '').replace(
            /[^A-Za-z0-9._-]+/g,
            '-',
          );
          const rangeSuffix = activeRangeLabel ? `-${activeRangeLabel}` : '';
          link.href = dataUrl;
          link.download = `${safeSymbol || 'asset'}${rangeSuffix}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Kart dışa aktarılırken hata oluştu', err);
        })
        .finally(() => {
          cardNode.style.top = prevTop;
          cardNode.style.left = prevLeft;
          cardNode.style.opacity = prevOpacity;
          cardNode.style.visibility = prevVisibility;
        });
    };

    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        window.setTimeout(exportNow, 50);
      });
    } else {
      window.setTimeout(exportNow, 50);
    }
  };

  return (
    <header className="header">
      <div className="header__content">
        {location.pathname !== '/' && (
          <button
            type="button"
            className="header__back-button"
            onClick={handleBackClick}
            aria-label="Geri"
          >
            <RiArrowLeftLine />
          </button>
        )}

        <button className="header__logo" onClick={handleLogoClick}>
          <img src="/logo.svg" alt="logo" className="header__logo-img" />
          <span className="header__logo--light">finance</span>
        </button>

        {assetSymbol && (
          <>
            <button
              type="button"
              className={`header__bookmark-button ${
                isAssetBookmarked ? 'header__bookmark-button--active' : ''
              }`}
              onClick={handleHeaderBookmarkClick}
              aria-pressed={isAssetBookmarked}
              aria-label={
                isAssetBookmarked
                  ? 'Kaydedilenlerden kaldır'
                  : 'Kaydedilenlere ekle'
              }
            >
              {isAssetBookmarked ? <RiBookmarkFill /> : <RiBookmarkLine />}
            </button>

            <button
              type="button"
              className="header__export-button"
              onClick={handleExportClick}
              aria-label="Kartı dışa aktar"
            >
              <RiDownloadLine />
            </button>
          </>
        )}

        <nav className="header__nav">
          <Link
            to="/"
            className={`header__link ${
              location.pathname === '/' ? 'active' : ''
            }`}
          >
            <RiHomeLine />
            <span>Anasayfa</span>
          </Link>

          <Link
            to="/search"
            className={`header__link ${
              location.pathname === '/search' ? 'active' : ''
            }`}
          >
            <RiSearchLine />
            <span>Ara</span>
          </Link>

          <Link
            to="/about"
            className={`header__link ${
              location.pathname === '/about' ? 'active' : ''
            }`}
          >
            <RiInformationLine />
            <span>Hakkımızda</span>
          </Link>

          <Link
            to="/bookmarks"
            className={`header__link ${
              location.pathname === '/bookmarks' ? 'active' : ''
            }`}
          >
            <RiBookmarkLine />
            <span>Kaydedilenler</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
