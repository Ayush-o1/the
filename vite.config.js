import { defineConfig } from 'vite';

// base './' lets the built site work at ayush-o1.github.io/the/ and on a custom domain.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    assetsInlineLimit: 0,
  },
});
