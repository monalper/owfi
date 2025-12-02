import React from 'react';
import './TimeRangeToggle.css';

const OPTIONS = [
  { key: '1G', label: '1G' },
  { key: '1H', label: '1H' },
  { key: '1A', label: '1A' },
  { key: '3A', label: '3A' },
  { key: '6A', label: '6A' },
  { key: '1Y', label: '1Y' },
  { key: '5Y', label: '5Y' },
  { key: 'MAX', label: 'MAX' },
];

function TimeRangeToggle({ value, onChange }) {
  return (
    <div className="time-toggle-root">
      {OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          className={
            value === option.key
              ? 'time-toggle-item time-toggle-item-active'
              : 'time-toggle-item'
          }
          onClick={() => onChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default TimeRangeToggle;
