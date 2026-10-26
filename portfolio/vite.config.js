import { defineConfig } from 'vite';
export default defineConfig({
  server: { port: 5180, host: true },
  preview: { port: 5181 },
  build: { target: 'es2022', assetsInlineLimit: 0, chunkSizeWarningLimit: 700,
    rollupOptions: { output: { manualChunks: { three: ['three'], motion: ['gsap', 'lenis'] } } } },
});
