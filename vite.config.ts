import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    extensions: ['.js', '.ts', '.json'],
    alias: {
      '@': '/src',
    },
  },
  optimizeDeps: {
    include: ['lib/index.js'],
  },
  server: {
    fs: {
      strict: false,
    },
  },
});
