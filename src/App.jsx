import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage.jsx';
import AssetDetailPage from './pages/AssetDetailPage/AssetDetailPage.jsx';
import SearchResultsPage from './pages/SearchResultsPage/SearchResultsPage.jsx';
import BookmarksPage from './pages/BookmarksPage/BookmarksPage.jsx';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage.jsx';
import Header from './components/Header/Header.jsx';
import './App.css';

function App() {
  return (
    <div className="app-root">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/asset/:symbol" element={<AssetDetailPage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
