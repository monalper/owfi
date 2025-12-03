import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  RiHomeLine,
  RiSearchLine,
  RiInformationLine,
  RiBookmarkLine,
  RiBookmarkFill,
  RiArrowLeftLine,
} from 'react-icons/ri';
import {
  isSymbolBookmarked,
  toggleSymbolBookmark,
} from '../../utils/bookmarksStorage.js';
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
