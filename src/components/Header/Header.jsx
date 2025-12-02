import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { RiHomeLine, RiSearchLine, RiInformationLine, RiBookmarkLine } from 'react-icons/ri';
import './Header.css';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = () => navigate('/');

  return (
    <header className="header">
      <div className="header__content">
        <button className="header__logo" onClick={handleLogoClick}>
          <img src="/logo.svg" alt="logo" className="header__logo-img" />
          <span className="header__logo--light">finance</span>
        </button>

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

