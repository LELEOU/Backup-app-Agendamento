import { defineConfig } from 'vite';

export default defineConfig({
  root: './src',
  build: {
    outDir: '../dist',
    minify: false,
    emptyOutDir: true,
    rollupOptions: {
      input: './src/index.html'
    }
  },
  publicDir: './src/assets',
  optimizeDeps: {
    include: ['@supabase/supabase-js']
  }
});
