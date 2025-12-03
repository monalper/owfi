import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchSymbols } from '../../api/yahooClient.js';
import SearchBar from '../../components/SearchBar/SearchBar.jsx';
import './SearchResultsPage.css';

const PAGE_SIZE = 20;

function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

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
          setError(err.message || 'Arama sırasında bir hata oluştu.');
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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, results.length]);

  const hasQuery = query.trim().length > 0;
  const hasResults = results.length > 0;

  return (
    <div className="search-page-root">
      <section className="search-page-header">
        <SearchBar autoFocus />
      </section>

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
          <span>"{query}" için sonuç bulunamadı.</span>
        </div>
      )}

      {loading && (
        <div className="search-page-loading">
          <span>Sonuçlar getiriliyor...</span>
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
                <span className="search-page-row-exchange">{item.exchange}</span>
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
