const STORAGE_KEY = 'owfin:bookmarks';

function safeGetLocalStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getBookmarkedSymbols() {
  const storage = safeGetLocalStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item === 'string');
  } catch {
    return [];
  }
}

export function isSymbolBookmarked(symbol) {
  if (!symbol) return false;
  const list = getBookmarkedSymbols();
  const upper = String(symbol).toUpperCase();
  return list.some((item) => String(item).toUpperCase() === upper);
}

export function setBookmarkedSymbols(nextList) {
  const storage = safeGetLocalStorage();
  if (!storage) return;

  try {
    const normalized = Array.from(
      new Set(
        (nextList || [])
          .filter((item) => typeof item === 'string' && item.trim() !== '')
          .map((item) => item.trim()),
      ),
    );
    storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // sessizce yut
  }
}

export function toggleSymbolBookmark(symbol) {
  if (!symbol) return false;
  const storage = safeGetLocalStorage();
  if (!storage) return false;

  const upper = String(symbol).toUpperCase();
  const current = getBookmarkedSymbols();

  const exists = current.some(
    (item) => String(item).toUpperCase() === upper,
  );

  let next;
  if (exists) {
    next = current.filter(
      (item) => String(item).toUpperCase() !== upper,
    );
  } else {
    next = [...current, symbol];
  }

  setBookmarkedSymbols(next);
  return !exists;
}

