import { PRESET_LISTS } from '../src/config/lists.js';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_PAGE_TITLE,
  patchHtmlWithMeta,
} from './meta-utils.mjs';

export default async function handler(req, res) {
  try {
    const idParam = (req.query && (req.query.id || req.query.listId)) || '';
    const listId = Array.isArray(idParam) ? idParam[0] : idParam;

    const host = req.headers.host || 'localhost:3000';
    const isLocalhost =
      host.startsWith('localhost') || host.startsWith('127.0.0.1');
    const protocol = isLocalhost ? 'http' : 'https';

    const baseUrl = `${protocol}://${host}/`;

    const baseResponse = await fetch(baseUrl, {
      method: 'GET',
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!baseResponse.ok) {
      throw new Error(
        `Base HTML fetch failed with status ${baseResponse.status}`,
      );
    }

    const baseHtml = await baseResponse.text();

    let meta = {
      title: DEFAULT_PAGE_TITLE,
      description: DEFAULT_DESCRIPTION,
      image: undefined,
    };

    if (listId) {
      const list = PRESET_LISTS.find((item) => item.id === listId);

      if (list) {
        const title = `${list.title} | Openwall Finance`;
        const description = `${list.title} listesindeki seçili varlıklar ve piyasa verileri. Piyasaları Openwall Finance'den takip edin.`;

        const nameForImage =
          title.replace(/\s*\|\s*Openwall Finance\s*$/i, '') ||
          list.title;

        const ogImageUrl = `https://og-image.vercel.app/${encodeURIComponent(
          nameForImage,
        )}.png?theme=dark&md=0&fontSize=64px`;

        meta = { title, description, image: ogImageUrl };
      } else {
        meta = {
          title: 'Listeler | Openwall Finance',
          description: DEFAULT_DESCRIPTION,
        };
      }
    }

    const html = patchHtmlWithMeta(baseHtml, meta);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('list-page handler error', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Internal Server Error');
  }
}

