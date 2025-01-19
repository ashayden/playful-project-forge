import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react(), tsconfigPaths()],
    base: '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@langchain/core': path.resolve(__dirname, 'node_modules/@langchain/core/dist/index.js'),
        '@langchain/core/messages': path.resolve(__dirname, 'node_modules/@langchain/core/dist/messages/index.js'),
      }
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
            'ai-vendor': ['@langchain/openai', '@langchain/core'],
            'utils': ['./src/lib/utils.ts', './src/services/loggingService.ts'],
            'chat-core': ['./src/services/ai/AIService.ts', './src/services/ai/ChatService.ts'],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      sourcemap: true,
      // Performance optimizations
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: !env.DEV,
          drop_debugger: !env.DEV,
        },
      },
      // Asset optimization
      assetsInlineLimit: 4096, // 4kb
      reportCompressedSize: false,
      commonjsOptions: {
        include: [/@langchain\/.*/, /node_modules/],
      }
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@radix-ui/react-dialog',
        '@radix-ui/react-dropdown-menu',
        '@langchain/openai',
        '@langchain/core',
      ],
      exclude: []
    },
    server: {
      port: 3000,
      strictPort: true,
      // Enable HMR
      hmr: {
        overlay: true,
      },
    },
    preview: {
      port: 3000,
      strictPort: true,
    }
  };
});
