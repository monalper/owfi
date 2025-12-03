import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header.jsx';
import './App.css';

const HomePage = React.lazy(() => import('./pages/HomePage/HomePage.jsx'));
const AssetDetailPage = React.lazy(
  () => import('./pages/AssetDetailPage/AssetDetailPage.jsx'),
);
const SearchResultsPage = React.lazy(
  () => import('./pages/SearchResultsPage/SearchResultsPage.jsx'),
);
const ListDetailPage = React.lazy(
  () => import('./pages/ListDetailPage/ListDetailPage.jsx'),
);
const BookmarksPage = React.lazy(
  () => import('./pages/BookmarksPage/BookmarksPage.jsx'),
);
const NotFoundPage = React.lazy(
  () => import('./pages/NotFoundPage/NotFoundPage.jsx'),
);

function App() {
  return (
    <div className="app-root">
      <Header />
      <main className="app-main">
        <React.Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/asset/:symbol" element={<AssetDetailPage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/lists/:listId" element={<ListDetailPage />} />
            <Route path="/bookmarks" element={<BookmarksPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </React.Suspense>
      </main>
    </div>
  );
}

export default App;
