import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// Go (Octicons) ve Ci (Circum Icons) importları
import { GoHomeFill, GoSearch, GoInfo } from 'react-icons/go';
import { CiBookmark } from 'react-icons/ci';
import './Header.css';

function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = () => navigate('/');

  return (
    <header className="header">
      <div className="header__content">

        {/* LOGO */}
        <button className="header__logo" onClick={handleLogoClick}>
          <img src="/logo.svg" alt="logo" className="header__logo-img" />
          <span className="header__logo--light">finance</span>
        </button>

        {/* NAVIGATION */}
        <nav className="header__nav">
          
          {/* ANASAYFA */}
          <Link
            to="/"
            className={`header__link ${
              location.pathname === '/' ? 'active' : ''
            }`}
          >
            <GoHomeFill />
            <span>Anasayfa</span>
          </Link>

          {/* ARA */}
          <Link
            to="/search"
            className={`header__link ${
              location.pathname === '/search' ? 'active' : ''
            }`}
          >
            <GoSearch />
            <span>Ara</span>
          </Link>

          {/* HAKKIMIZDA */}
          <Link
            to="/about"
            className={`header__link ${
              location.pathname === '/about' ? 'active' : ''
            }`}
          >
            <GoInfo />
            <span>Hakkımızda</span>
          </Link>

          {/* KAYDEDİLENLER */}
          <Link
            to="/bookmarks"
            className={`header__link ${
              location.pathname === '/bookmarks' ? 'active' : ''
            }`}
          >
            <CiBookmark strokeWidth={0.5} />
            <span>Kaydedilenler</span>
          </Link>

        </nav>

      </div>
    </header>
  );
}

export default Header;