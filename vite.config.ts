/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': path.resolve(import.meta.dirname, './shared'),
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },
  // `vite preview` needs the same /api proxy as the dev server so the built
  // app is exercised against the real API on one origin.
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.PORT ?? 4000}`,
        changeOrigin: false,
      },
    },
  },
  server: {
    port: 3000,
    // One origin in dev as in production, so the cookie and CSRF rules are the
    // same everywhere and the browser never makes a cross-origin API call.
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${process.env.PORT ?? 4000}`,
        changeOrigin: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Keep the framework, the animation runtime and the chart library in
        // their own long-lived chunks so the entry chunk stays small and none
        // of them is duplicated into a route chunk. Rolldown only accepts the
        // function form.
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;
          const path = id.split('node_modules/').pop() ?? '';
          if (/^(react|react-dom|react-router|react-router-dom|scheduler)\//.test(path)) {
            return 'react';
          }
          if (/^(motion|motion-dom|motion-utils|framer-motion)\//.test(path)) return 'motion';
          if (
            /^(recharts|recharts-scale|victory-vendor|d3-[a-z]+|internmap|decimal\.js-light|eventemitter3|fast-equals)\//.test(
              path
            )
          ) {
            return 'recharts';
          }
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', 'shared/**/*.test.ts'],
    restoreMocks: true,
  },
});
