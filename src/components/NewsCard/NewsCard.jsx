import React from 'react';
import './NewsCard.css';

function formatDateShort(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function NewsCard({ title, publisher, publishedAt, thumbnailUrl, link }) {
  const dateLabel = publishedAt ? formatDateShort(publishedAt) : null;

  const content = (
    <div className="news-card-root">
      <div className="news-card-main">
        <div className="news-card-text">
          <div className="news-card-title">{title}</div>
          <div className="news-card-meta">
            {publisher && (
              <span className="news-card-publisher">{publisher}</span>
            )}
            {publisher && dateLabel && (
              <span className="news-card-dot">•</span>
            )}
            {dateLabel && <span className="news-card-date">{dateLabel}</span>}
          </div>
        </div>
        {thumbnailUrl && (
          <div className="news-card-thumbnail-wrapper">
            <img
              src={thumbnailUrl}
              alt={title}
              className="news-card-thumbnail"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noreferrer"
        className="news-card-link"
      >
        {content}
      </a>
    );
  }

  return content;
}

export default NewsCard;
