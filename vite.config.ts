import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  envPrefix: [
    'NEXT_PUBLIC_',
    'VITE_',
    'SUPABASE_',
    'OPENAI_'
  ],
  server: {
    port: 3000,
    proxy: {
      '/api/chat': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.method === 'OPTIONS') {
              res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'Content-Type',
              });
              res.end();
              return;
            }
            
            if (req.method !== 'POST') {
              res.writeHead(405);
              res.end('Method not allowed');
              return;
            }
          });
        },
      },
    },
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      external: [],
    },
  },
}); 