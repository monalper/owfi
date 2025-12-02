import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchSymbols } from '../../api/yahooClient.js';
import SearchBar from '../../components/SearchBar/SearchBar.jsx';
import './SearchResultsPage.css';

function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!query || query.length < 2) {
        setResults([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await searchSymbols(query);
        if (cancelled) return;
        setResults(data);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Arama sırasında hata oluştu.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div className="search-page-root">
      <section className="search-page-header">
        <h1 className="search-page-title">Piyasalarda Ara</h1>
        <SearchBar autoFocus />
      </section>

      {error && (
        <div className="search-page-error">
          <span>{error}</span>
        </div>
      )}

      {!query && (
        <div className="search-page-empty">
          <span>Aramak için yukarıya en az 2 karakter yazın.</span>
        </div>
      )}

      {query && !loading && results.length === 0 && !error && (
        <div className="search-page-empty">
          <span>"{query}" için sonuç bulunamadı.</span>
        </div>
      )}

      {loading && (
        <div className="search-page-loading">
          <span>Sonuçlar getiriliyor…</span>
        </div>
      )}

      {!loading && results.length > 0 && (
        <section className="search-page-results">
          {results.map((item) => (
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

