import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import './SearchBar.css';

function SearchBar({ autoFocus = false }) {
  const [searchParams] = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') ?? '');
  const navigate = useNavigate();

  useEffect(() => {
    setValue(searchParams.get('q') ?? '');
  }, [searchParams]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;

    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <form className="searchbar-root" onSubmit={handleSubmit}>
      <FaSearch className="searchbar-icon" size={14} />
      <input
        className="searchbar-input"
        placeholder="Hisse, fon, döviz ara"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoFocus={autoFocus}
      />
      <button type="submit" className="searchbar-submit">
        Ara
      </button>
    </form>
  );
}

export default SearchBar;

