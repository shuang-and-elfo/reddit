import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function redditImageProxy() {
  return {
    name: 'reddit-image-proxy',
    configureServer(server) {
      server.middlewares.use('/reddit-media', async (req, res) => {
        try {
          const url = decodeURIComponent(req.url.slice(1));
          const resp = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; RedditRedesign/1.0)',
              'Accept': 'image/*,*/*',
            },
          });
          if (!resp.ok) {
            res.writeHead(resp.status);
            res.end();
            return;
          }
          const contentType = resp.headers.get('content-type') || 'image/jpeg';
          res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=86400',
          });
          const buffer = Buffer.from(await resp.arrayBuffer());
          res.end(buffer);
        } catch {
          res.writeHead(502);
          res.end();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), redditImageProxy()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/reddit-api': {
        target: 'https://www.reddit.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/reddit-api/, ''),
        headers: {
          'User-Agent': 'web:reddit-grid-redesign:v1.0',
        },
      },
    },
  },
});
