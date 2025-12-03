import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchSymbols } from '../../api/yahooClient.js';
import SearchBar from '../../components/SearchBar/SearchBar.jsx';
import ListCard from '../../components/ListCard/ListCard.jsx';
import { PRESET_LISTS } from '../../config/lists.js';
import { usePageMetaTitle } from '../../utils/pageMeta.js';
import './SearchResultsPage.css';

const PAGE_SIZE = 20;
const MAX_VISIBLE_LISTS = 4;

const LIST_TABS = [
  {
    id: 'bist',
    labelDesktop: 'Borsa Istanbul',
    labelMobile: 'BIST',
    market: 'bist',
  },
  {
    id: 'us',
    labelDesktop: 'ABD Borsalari',
    labelMobile: 'ABD',
    market: 'us',
  },
  {
    id: 'funds',
    labelDesktop: 'Fonlar',
    labelMobile: 'Fonlar',
    market: 'funds',
  },
  {
    id: 'other',
    labelDesktop: 'Diger Borsalar',
    labelMobile: 'Borsalar',
    market: 'other',
  },
];

function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeTab, setActiveTab] = useState(LIST_TABS[0].id);
  const [showAllLists, setShowAllLists] = useState(false);
  const [gliderStyle, setGliderStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef({});

  const trimmedQuery = query.trim();
  const pageTitle = trimmedQuery
    ? `${trimmedQuery} | Openwall Finance`
    : 'Arama | Openwall Finance';

  usePageMetaTitle(pageTitle);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const trimmed = query.trim();

      if (!trimmed) {
        setResults([]);
        setVisibleCount(PAGE_SIZE);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await searchSymbols(trimmed);
        if (cancelled) return;
        setResults(data);
        setVisibleCount(PAGE_SIZE);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Arama sirasinda bir hata olustu.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [query]);

  useEffect(() => {
    function handleScroll() {
      if (loading || results.length === 0) return;

      const scrollPosition = window.innerHeight + window.scrollY;
      const threshold = document.body.offsetHeight - 200;

      if (scrollPosition >= threshold) {
        setVisibleCount((current) => {
          if (current >= results.length) return current;
          const next = Math.min(current + PAGE_SIZE, results.length);
          return next;
        });
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, results.length]);

  const hasQuery = query.trim().length > 0;
  const hasResults = results.length > 0;

  useEffect(() => {
    const activeElement = tabRefs.current[activeTab];
    if (activeElement) {
      setGliderStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    setShowAllLists(false);
  }, [activeTab]);

  const activeMarket = LIST_TABS.find((tab) => tab.id === activeTab)?.market;

  const listItems = PRESET_LISTS.filter(
    (item) => !activeMarket || item.market === activeMarket,
  );

  const visibleListItems = showAllLists
    ? listItems
    : listItems.slice(0, MAX_VISIBLE_LISTS);

  return (
    <div className="search-page-root">
      <section className="search-page-header">
        <h1 className="search-page-title"></h1>
        <SearchBar />
      </section>

      {!hasQuery && (
        <>
          <h2 className="search-page-section-title">
            <span>Daha Fazlası</span>
          </h2>
          <div className="search-page-tabs">
            <div
              className="search-page-tabs-glider"
              style={{
                left: gliderStyle.left,
                width: gliderStyle.width,
              }}
            />
            {LIST_TABS.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                type="button"
                className={`search-page-tab${
                  tab.id === activeTab ? ' search-page-tab-active' : ''
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="search-page-tab-label-desktop">
                  {tab.labelDesktop}
                </span>
                <span className="search-page-tab-label-mobile">
                  {tab.labelMobile || tab.labelDesktop}
                </span>
              </button>
            ))}
          </div>

          <section className="search-page-lists">
            {visibleListItems.map((list) => (
              <ListCard
                key={list.id}
                to={`/lists/${list.id}`}
                icon={list.emoji}
                iconImage={list.iconImage}
                title={list.title}
              />
            ))}
          </section>

          {listItems.length > MAX_VISIBLE_LISTS && (
            <button
              type="button"
              className="search-page-lists-toggle"
              onClick={() => setShowAllLists((prev) => !prev)}
            >
              {showAllLists ? 'Daha az liste' : 'Daha fazla liste'}
            </button>
          )}
        </>
      )}

      {error && (
        <div className="search-page-error">
          <span>{error}</span>
        </div>
      )}

      {!hasQuery && !loading && !error && (
        <div className="search-page-empty">
          <span></span>
        </div>
      )}

      {hasQuery && !loading && !error && !hasResults && (
        <div className="search-page-empty">
          <span>"{query}" icin sonuc bulunamadi.</span>
        </div>
      )}

      {loading && (
        <div className="search-page-loading">
          <span>Sonuclar getiriliyor...</span>
        </div>
      )}

      {!loading && hasResults && (
        <section className="search-page-results">
          {results.slice(0, visibleCount).map((item) => (
            <Link
              key={`${item.symbol}-${item.exchange}`}
              to={`/asset/${encodeURIComponent(item.symbol)}`}
              className="search-page-row"
            >
              <div className="search-page-row-main">
                <div className="search-page-row-symbol">{item.symbol}</div>
                <div className="search-page-row-name">{item.shortname}</div>
              </div>
              <div className="search-page-row-meta">
                <span className="search-page-row-exchange">
                  {item.exchange}
                </span>
                <span className="search-page-row-type">{item.quoteType}</span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}

export default SearchResultsPage;
