const STORAGE_KEY = 'owfin:bookmarks:lists';

function safeGetLocalStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getBookmarkedListIds() {
  const storage = safeGetLocalStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => typeof item === 'string')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  } catch {
    return [];
  }
}

export function isListBookmarked(listId) {
  if (!listId) return false;
  const list = getBookmarkedListIds();
  const idStr = String(listId);
  return list.some((item) => String(item) === idStr);
}

export function setBookmarkedListIds(nextList) {
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

export function toggleListBookmark(listId) {
  if (!listId) return false;
  const storage = safeGetLocalStorage();
  if (!storage) return false;

  const idStr = String(listId);
  const current = getBookmarkedListIds();

  const exists = current.some((item) => String(item) === idStr);

  let next;
  if (exists) {
    next = current.filter((item) => String(item) !== idStr);
  } else {
    next = [...current, idStr];
  }

  setBookmarkedListIds(next);
  return !exists;
}

