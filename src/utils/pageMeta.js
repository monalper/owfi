import { useEffect } from 'react';

const DEFAULT_TITLE = 'Openwall Finance | Piyasalar';

export function updatePageMetaTitle(rawTitle) {
  if (typeof document === 'undefined') return;

  const title = rawTitle && String(rawTitle).trim().length > 0
    ? String(rawTitle).trim()
    : DEFAULT_TITLE;

  if (document.title !== title) {
    document.title = title;
  }

  const ogTitle = document.querySelector("meta[property='og:title']");
  if (ogTitle && ogTitle.getAttribute('content') !== title) {
    ogTitle.setAttribute('content', title);
  }

  const twitterTitle = document.querySelector("meta[name='twitter:title']");
  if (twitterTitle && twitterTitle.getAttribute('content') !== title) {
    twitterTitle.setAttribute('content', title);
  }
}

export function usePageMetaTitle(title) {
  useEffect(() => {
    updatePageMetaTitle(title);
  }, [title]);
}

