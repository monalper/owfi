import React from 'react';
import { ImageResponse } from '@vercel/og';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_PAGE_TITLE,
  buildAssetMeta,
} from './meta-utils.mjs';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol =
      searchParams.get('symbol') ||
      searchParams.get('s') ||
      '';

    let title = DEFAULT_PAGE_TITLE;
    let description = DEFAULT_DESCRIPTION;

    if (symbol) {
      const meta = await buildAssetMeta(symbol);
      if (meta?.title) {
        title = meta.title;
      }
      if (meta?.description) {
        description = meta.description;
      }
    }

    const titleText =
      (title || '').replace(/\s*\|\s*Openwall Finance\s*$/i, '') ||
      'Openwall Finance';

    const shortDescription =
      description && description.length > 140
        ? `${description.slice(0, 137)}...`
        : description;

    return new ImageResponse(
      React.createElement(
        'div',
        {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: 80,
            background:
              'radial-gradient(circle at 0 0, #3b82f6 0, #020617 45%, #020617 100%)',
            color: '#f9fafb',
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          },
        },
        React.createElement(
          'div',
          {
            style: {
              fontSize: 28,
              fontWeight: 500,
              opacity: 0.9,
            },
          },
          'Openwall Finance',
        ),
        React.createElement(
          'div',
          {
            style: {
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: '-0.04em',
              lineHeight: 1.1,
              maxWidth: '80%',
            },
          },
          titleText,
        ),
        React.createElement(
          'div',
          {
            style: {
              fontSize: 24,
              opacity: 0.9,
              maxWidth: '80%',
            },
          },
          shortDescription,
        ),
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('asset-og handler error', error);

    return new ImageResponse(
      React.createElement(
        'div',
        {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#020617',
            color: '#f9fafb',
            fontSize: 48,
            fontFamily:
              'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          },
        },
        'Openwall Finance',
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  }
}

