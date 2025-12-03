import React from 'react';
import { ImageResponse } from '@vercel/og';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_PAGE_TITLE,
  buildAssetMeta,
  normalizeAssetSymbol,
} from './meta-utils.mjs';

export default async function handler(req, res) {
  try {
    const host = req.headers.host || 'localhost:3000';
    const isLocalhost =
      host.startsWith('localhost') || host.startsWith('127.0.0.1');
    const protocol = isLocalhost ? 'http' : 'https';

    const url = new URL(req.url || '/', `${protocol}://${host}`);
    const symbolParam =
      url.searchParams.get('symbol') || url.searchParams.get('s') || '';

    const symbol = symbolParam || '';

    let meta = {
      title: DEFAULT_PAGE_TITLE,
      description: DEFAULT_DESCRIPTION,
      price: undefined,
      change: undefined,
      changePercent: undefined,
    };

    if (symbol) {
      const baseMeta = await buildAssetMeta(symbol);
      meta = { ...meta, ...baseMeta };
    }

    const displaySymbol = normalizeAssetSymbol(symbol || '');

    const nameFromTitle =
      meta.title && typeof meta.title === 'string'
        ? meta.title.replace(/\s*\|\s*Openwall Finance\s*$/i, '')
        : '';

    const longName = nameFromTitle || displaySymbol || symbol || 'Varlık';

    const hasPrice =
      typeof meta.price === 'number' && Number.isFinite(meta.price);
    const hasChangePercent =
      typeof meta.changePercent === 'number' &&
      Number.isFinite(meta.changePercent);

    let priceText = '';
    let isUp = false;

    if (hasPrice) {
      const p = meta.price;
      priceText = `${p.toFixed(2)} TRY`;
    }

    if (hasChangePercent) {
      const cp = meta.changePercent;
      const sign = cp >= 0 ? '+' : '';
      priceText = priceText
        ? `${priceText} ${sign}${cp.toFixed(2)}%`
        : `${sign}${cp.toFixed(2)}%`;
      isUp = cp >= 0;
    }

    const logoUrl = `${protocol}://${host}/logo.svg`;

    const rootStyle = {
      width: '100%',
      height: '100%',
      backgroundColor: '#1D1D1F',
      color: '#F9FAFB',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily:
        '"Inter Tight", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      position: 'relative',
    };

    const logoWrapperStyle = {
      position: 'absolute',
      top: 72,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };

    const symbolStyle = {
      fontSize: 96,
      fontWeight: 600,
      letterSpacing: '-0.06em',
      textTransform: 'uppercase',
      textAlign: 'center',
    };

    const nameStyle = {
      marginTop: 24,
      fontSize: 40,
      color: '#9CA3AF',
      textAlign: 'center',
      maxWidth: '80%',
    };

    const priceStyle = {
      marginTop: 32,
      fontSize: 48,
      fontWeight: 700,
      color: isUp ? '#22C55E' : '#EF4444',
      textAlign: 'center',
    };

    const footerStyle = {
      position: 'absolute',
      bottom: 64,
      fontSize: 32,
      color: '#E5E7EB',
    };

    const element = React.createElement(
      'div',
      { style: rootStyle },
      React.createElement(
        'div',
        { style: logoWrapperStyle },
        React.createElement('img', {
          src: logoUrl,
          width: 64,
          height: 64,
          alt: 'Openwall Finance',
        }),
      ),
      React.createElement('div', { style: symbolStyle }, displaySymbol),
      React.createElement('div', { style: nameStyle }, longName),
      priceText
        ? React.createElement('div', { style: priceStyle }, priceText)
        : null,
      React.createElement('div', { style: footerStyle }, 'Openwall Finance'),
    );

    const image = new ImageResponse(element, {
      width: 1200,
      height: 630,
    });

    const arrayBuffer = await image.arrayBuffer();
    image.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.statusCode = image.status || 200;
    res.end(Buffer.from(arrayBuffer));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('asset-og handler error', error);

    try {
      const fallback = new ImageResponse(
        React.createElement(
          'div',
          {
            style: {
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1D1D1F',
              color: '#F9FAFB',
              fontSize: 48,
              fontFamily:
                'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            },
          },
          'Openwall Finance',
        ),
        { width: 1200, height: 630 },
      );

      const buf = Buffer.from(await fallback.arrayBuffer());
      fallback.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      res.statusCode = fallback.status || 200;
      res.end(buf);
    } catch (innerError) {
      // eslint-disable-next-line no-console
      console.error('asset-og fallback error', innerError);
      res.statusCode = 500;
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      res.end('OG image error');
    }
  }
}
