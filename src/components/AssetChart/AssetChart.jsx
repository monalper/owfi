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
import './AssetChart.css';

const percentFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const greenColor = '#4cd964';
const redColor = '#ff3b30';

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

  // Min ve Max değerleri
  const minValue = Math.min(...data.map((point) => point.changePct));
  const maxValue = Math.max(...data.map((point) => point.changePct));
  
  // Padding (%10 boşluk)
  const padding = (maxValue - minValue) * 0.1;

  // 0 Noktasının (Zero Line) grafikteki yüzdelik konumunu hesapla
  // Bu, rengi tam 0 noktasında kesmek için gereklidir.
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
                /* DURUM 1: SONUÇ POZİTİF (YEŞİL) */
                <>
                  {/* 0'ın Üstü (Pozitif Alan): Yeşilden Şeffafa azalır */}
                  <stop offset="0%" stopColor={greenColor} stopOpacity={0.5} />
                  <stop offset={off} stopColor={greenColor} stopOpacity={0} />
                  
                  {/* 0'ın Altı (Negatif Alan): Tamamen Şeffaf (Görünmez) */}
                  <stop offset={off} stopColor={greenColor} stopOpacity={0} />
                  <stop offset="100%" stopColor={greenColor} stopOpacity={0} />
                </>
              ) : (
                /* DURUM 2: SONUÇ NEGATİF (KIRMIZI) */
                <>
                  {/* 0'ın Üstü (Pozitif Alan): Tamamen Şeffaf (Görünmez) */}
                  <stop offset="0%" stopColor={redColor} stopOpacity={0} />
                  <stop offset={off} stopColor={redColor} stopOpacity={0} />
                  
                  {/* 0'ın Altı (Negatif Alan): Şeffaftan Kırmızıya koyulaşır (Ters Gradient) */}
                  <stop offset={off} stopColor={redColor} stopOpacity={0} />
                  <stop offset="100%" stopColor={redColor} stopOpacity={0.5} />
                </>
              )}
            </linearGradient>
          </defs>

          <XAxis 
            dataKey="time" 
            hide 
          />
          <YAxis 
            // Domain'i padding'li değerlere göre ayarlıyoruz
            domain={[minValue - padding, maxValue + padding]} 
            hide 
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#2b2b2b',
              borderRadius: 12,
              border: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            }}
            itemStyle={{ color: '#fff' }}
            labelStyle={{ color: '#e3e3e3', marginBottom: '0.5rem' }}
            formatter={(value, name) => {
              if (name === 'changePct') return [`${percentFormatter.format(value)}%`, 'Değişim'];
              if (name === 'price') return [value, 'Fiyat'];
              return [value, name];
            }}
            labelFormatter={(label) =>
              label instanceof Date
                ? label.toLocaleString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : ''
            }
            cursor={{ stroke: '#e3e3e3', strokeWidth: 1, strokeDasharray: '3 3' }}
          />

          <ReferenceLine 
            y={0} 
            stroke="#e3e3e3" 
            strokeDasharray="3 3" 
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