import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
  build: {
    sourcemap: true,
    rollupOptions: {
      external: [],
    },
  },
}); 