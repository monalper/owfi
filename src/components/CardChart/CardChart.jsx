import React from 'react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
} from 'recharts';
import './CardChart.css';

function CardChart({ data, color, chartId }) {
  // Veri kontrolü
  if (!data || data.length === 0) {
    return null;
  }

  // Renk belirleme: dışarıdan gelmezse son veriye göre otomatik seç
  let strokeColor = color;
  if (!strokeColor) {
    const lastPoint = data[data.length - 1];
    strokeColor = lastPoint.changePct >= 0 ? '#30d158' : '#ff453a';
  }

  // Benzersiz ID oluşturma:
  // React'in random ID'leri bazen eşleşmeyebiliyor (hydration mismatch).
  // Bu yüzden sembol ismini (chartId) kullanarak sabit bir ID üretiyoruz.
  // Örn: THYAO.IS -> gradient-THYAOIS
  const safeId = chartId
    ? chartId.replace(/[^a-zA-Z0-9]/g, '')
    : Math.random().toString(36).substr(2, 9);

  const gradientId = `gradient-${safeId}`;

  // Grafik alt/üst boşluklarını ayarlama (çizgi tavana yapışmasın)
  const values = data.map((d) => d.changePct);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const padding = range * 0.1; // %10 boşluk

  return (
    <div className="card-chart-root">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={strokeColor} stopOpacity={0.45} />
              <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          <YAxis
            hide
            domain={[min - padding, max + padding]}
          />

          <Area
            type="monotone"
            dataKey="changePct"
            stroke={strokeColor}
            strokeWidth={2}
            baseValue="dataMin" // Alan her zaman çizginin altına dolsun
            fill={`url(#${gradientId})`}
            fillOpacity={1}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CardChart;

