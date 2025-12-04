import React, { useEffect, useMemo, useState } from 'react';
import { fetchComparisonChange } from '../../api/yahooClient.js';
import TimeRangeToggle from '../TimeRangeToggle/TimeRangeToggle.jsx';

const percentFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const COMPARISON_RANGES = [
  { key: '1A', label: '1A' },
  { key: '3A', label: '3A' },
  { key: 'YTD', label: 'YTD' },
  { key: '1Y', label: '1Y' },
  { key: '3Y', label: '3Y' },
];

const BASE_ASSETS = [
  { id: 'self', symbolKey: 'self', label: null, tone: 'primary' },
  { id: 'gold', symbolKey: 'GC=F', label: 'Altın', tone: 'accent' },
  { id: 'silver', symbolKey: 'SI=F', label: 'Gümüş', tone: 'accent' },
  { id: 'usdtry', symbolKey: 'USDTRY=X', label: 'Dolar', tone: 'accent' },
  { id: 'bist100', symbolKey: 'XU100.IS', label: 'BIST 100', tone: 'accent' },
];

const ICON_CONFIG = {
  self: { src: '/detail/secili.png', alt: 'Seçili varlık' },
  gold: { src: '/detail/altın.png', alt: 'Altın' },
  silver: { src: '/detail/gümüs.png', alt: 'Gümüş' },
  usdtry: { src: '/detail/dolar.png', alt: 'Dolar' },
  bist100: { src: '/detail/bist100.png', alt: 'BIST 100' },
};

function AssetComparison({ symbol, primaryName }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeRange, setActiveRange] = useState('1Y');

  useEffect(() => {
    let cancelled = false;

    async function loadComparison() {
      const trimmedSymbol = String(symbol ?? '').trim();

      if (!trimmedSymbol) {
        setRows([]);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const assets = BASE_ASSETS.map((item) => {
          if (item.id === 'self') {
            return {
              ...item,
              symbol: trimmedSymbol,
              label: trimmedSymbol,
              name: primaryName || null,
            };
          }
          return { ...item, symbol: item.symbolKey, name: null };
        });

        const nextRows = [];

        await Promise.all(
          assets.map(async (asset) => {
            const assetSymbol = asset.symbol;
            if (!assetSymbol) return;

            const changes = {};

            await Promise.all(
              COMPARISON_RANGES.map(async (range) => {
                try {
                  const stats = await fetchComparisonChange(
                    assetSymbol,
