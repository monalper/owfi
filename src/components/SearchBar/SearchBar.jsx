import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LuSearch } from "react-icons/lu";
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
      <button type="submit" className="searchbar-submit" aria-label="Ara">
        <LuSearch className="searchbar-icon" size={32} />
      </button>
      <input
        className="searchbar-input"
        placeholder="Openwall Finance'da ara"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoFocus={autoFocus}
      />
    </form>
  );
}

export default SearchBar;

