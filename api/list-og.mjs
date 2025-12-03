import React from 'react';
import { ImageResponse } from '@vercel/og';
import { PRESET_LISTS } from '../src/config/lists.js';
import { DEFAULT_DESCRIPTION } from './meta-utils.mjs';

export default async function handler(req, res) {
  try {
    const host = req.headers.host || 'localhost:3000';
    const isLocalhost =
      host.startsWith('localhost') || host.startsWith('127.0.0.1');
    const protocol = isLocalhost ? 'http' : 'https';

    const url = new URL(req.url || '/', `${protocol}://${host}`);
    const rawId =
      url.searchParams.get('id') || url.searchParams.get('listId') || '';

    const listId = rawId || '';

    let list = null;

    if (listId) {
      list = PRESET_LISTS.find((item) => item.id === listId) || null;
    }

    const titleText = list?.title || 'Liste';

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

    const titleStyle = {
      fontSize: 52,
      fontWeight: 600,
      textAlign: 'center',
      maxWidth: '80%',
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
      React.createElement('div', { style: titleStyle }, titleText),
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
    console.error('list-og handler error', error);

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
                '"Inter Tight", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
      console.error('list-og fallback error', innerError);
      res.statusCode = 500;
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      res.end('OG image error');
    }
  }
}
