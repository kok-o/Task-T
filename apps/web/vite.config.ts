import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-calendar': ['react-big-calendar', 'date-fns'],
          'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-ui': ['lucide-react', 'sonner', 'zustand']
        }
      }
    },
    chunkSizeWarningLimit: 500,
  }
});
