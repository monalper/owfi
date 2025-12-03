import React from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { SkeletonBlock, SkeletonLine } from '../Skeleton/Skeleton.jsx';
import './AssetChart.css';

export function AssetChartSkeleton() {
  return (
    <div className="asset-chart-root">
      <div className="asset-chart-skeleton-card">
        <div className="asset-chart-skeleton-header-row">
          <SkeletonLine className="asset-chart-skeleton-title" />
          <SkeletonLine className="asset-chart-skeleton-subtitle" />
        </div>
        <div className="asset-chart-skeleton-chart-area">
          <SkeletonBlock className="asset-chart-skeleton-chart-block" />
        </div>
      </div>
    </div>
  );
}

const percentFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const greenColor = '#4cd964';
const redColor = '#ff3b30';

// Özelleştirilmiş Tooltip Bileşeni
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isPositive = data.changePct >= 0;

    return (
      <div className="custom-tooltip">
        {/* Tarih ve Saat */}
        <div className="tooltip-date">
          {dateFormatter.format(new Date(label))}
        </div>
        
        {/* Fiyat ve Değişim Oranı */}
        <div className="tooltip-row">
          <div className="tooltip-item">
            <span className="tooltip-label">Fiyat:</span>
            <span className="tooltip-value">{data.price}</span>
          </div>
          
          <div className="tooltip-item">
            <span className="tooltip-label">Değişim:</span>
            <span 
              className="tooltip-value" 
              style={{ color: isPositive ? greenColor : redColor }}
            >
              %{percentFormatter.format(data.changePct)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

function AssetChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="asset-chart-empty">
        <span>Grafik verisi bulunamadı.</span>
      </div>
    );
  }

  const lastPoint = data[data.length - 1];
  const isPositive = lastPoint.changePct >= 0;
  const strokeColor = isPositive ? greenColor : redColor;

  const minValue = Math.min(...data.map((point) => point.changePct));
  const maxValue = Math.max(...data.map((point) => point.changePct));
  const padding = (maxValue - minValue) * 0.1;

  const getGradientOffset = () => {
    const dataMax = maxValue + padding;
    const dataMin = minValue - padding;
    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    return dataMax / (dataMax - dataMin);
  };

  const off = getGradientOffset();

  return (
    <div className="asset-chart-root">
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart
          data={data}
          margin={{ top: 5, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
              {isPositive ? (
                <>
                  <stop offset="0%" stopColor={greenColor} stopOpacity={0.5} />
                  <stop offset={off} stopColor={greenColor} stopOpacity={0} />
                  <stop offset={off} stopColor={greenColor} stopOpacity={0} />
                  <stop offset="100%" stopColor={greenColor} stopOpacity={0} />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor={redColor} stopOpacity={0} />
                  <stop offset={off} stopColor={redColor} stopOpacity={0} />
                  <stop offset={off} stopColor={redColor} stopOpacity={0} />
                  <stop offset="100%" stopColor={redColor} stopOpacity={0.5} />
                </>
              )}
            </linearGradient>
          </defs>

          <XAxis dataKey="time" hide />
          <YAxis domain={[minValue - padding, maxValue + padding]} hide />

          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: '#e3e3e3', strokeWidth: 1, strokeDasharray: '7 7' }}
            // Recharts wrapper focus sorununu engellemek için ek ayar
            wrapperStyle={{ outline: 'none' }}
          />

          <ReferenceLine 
            y={0} 
            stroke="#e3e3e3" 
            strokeDasharray="7 7" 
            strokeOpacity={0.5} 
          />

          <Area
            type="monotone"
            dataKey="changePct"
            stroke={strokeColor}
            strokeWidth={2}
            fill="url(#splitColor)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default AssetChart;
