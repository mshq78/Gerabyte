/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
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
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
});
