import React from 'react';
import './Skeleton.css';

export function SkeletonBlock({ className = '', style }) {
  return <div className={`skeleton-block ${className}`.trim()} style={style} />;
}

export function SkeletonLine({ className = '', style }) {
  return <div className={`skeleton-line ${className}`.trim()} style={style} />;
}

export function SkeletonCircle({ className = '', style }) {
  return <div className={`skeleton-circle ${className}`.trim()} style={style} />;
}

export function SkeletonPill({ className = '', style }) {
  return <div className={`skeleton-pill ${className}`.trim()} style={style} />;
}

