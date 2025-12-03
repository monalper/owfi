import React, { useState, useRef, useEffect } from 'react';
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
  const [gliderStyle, setGliderStyle] = useState({ left: 0, width: 0 });
  const itemsRef = useRef({});

  // Seçili eleman değiştiğinde veya ekran boyutu değiştiğinde çalışır
  useEffect(() => {
    const activeElement = itemsRef.current[value];
    if (activeElement) {
      setGliderStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth
      });
    }
  }, [value]);

  return (
    <div className="time-toggle-root">
      {/* Kayan arka plan parçası */}
      <div 
        className="time-toggle-glider"
        style={{ 
          left: gliderStyle.left, 
          width: gliderStyle.width 
        }}
      />

      {OPTIONS.map((option) => (
        <button
          key={option.key}
          ref={(el) => (itemsRef.current[option.key] = el)}
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