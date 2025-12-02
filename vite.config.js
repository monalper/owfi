import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

function yahooProxyPlugin() {
  const target = 'https://query1.finance.yahoo.com';

  const handler = async (req, res, next) => {
    try {
      if (!req.url || !req.url.startsWith('/api/yahoo')) {
        next();
        return;
      }

      const upstreamPath = req.url.replace(/^\/api\/yahoo/, '') || '/';
      const targetUrl = `${target}${upstreamPath}`;

      const upstreamResponse = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          accept: 'application/json, text/plain, */*',
        },
      });

      res.statusCode = upstreamResponse.status;

      const contentType = upstreamResponse.headers.get('content-type');
      if (contentType) {
        res.setHeader('content-type', contentType);
      }

      const text = await upstreamResponse.text();
      res.end(text);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Yahoo proxy error', error);
      res.statusCode = 500;
      res.end('Yahoo proxy error');
    }
  };

  return {
    name: 'yahoo-proxy-plugin',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), yahooProxyPlugin()],
  server: {
    port: 5173,
  },
});
