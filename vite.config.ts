import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';
  
  return {
    plugins: [react(), tsconfigPaths()],
    base: '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    server: {
      port: 3000,
      strictPort: true,
      hmr: {
        overlay: true,
      },
      proxy: {
        '/api/chat': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Sending Request to the Target:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-toast',
              '@radix-ui/react-tooltip',
            ],
            'supabase-vendor': ['@supabase/supabase-js', '@supabase/auth-ui-react'],
            'utils': ['./src/lib/utils.ts', './src/services/loggingService.ts'],
            'chat-core': ['./src/services/ai/AIService.ts', './src/services/ai/ChatService.ts'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: !isProd,
      minify: isProd ? 'terser' : false,
      terserOptions: isProd ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        format: {
          comments: false
        }
      } : undefined,
      assetsInlineLimit: 4096,
      reportCompressedSize: false,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
      ],
      exclude: ['@langchain/openai', '@langchain/core'],
    },
    preview: {
      port: 3000,
      strictPort: true,
    }
  };
});
