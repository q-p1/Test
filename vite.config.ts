import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vitejs.dev/config/
// Two build shapes:
//  - default: hashed, code-split assets for a normal static host.
//  - `--mode single`: one fully self-contained index.html (JS/CSS/fonts inlined)
//    for embedding anywhere without a server (used for the shareable preview).
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    plugins: [react(), ...(single ? [viteSingleFile()] : [])],
    define: single ? { 'import.meta.env.VITE_ARTIFACT': 'true' } : {},
    build: single
      ? {
          target: 'es2020',
          assetsInlineLimit: 100_000_000, // inline fonts as data URIs
          cssCodeSplit: false,
        }
      : {
          target: 'es2020',
          cssCodeSplit: true,
          rollupOptions: {
            output: {
              manualChunks: {
                react: ['react', 'react-dom', 'react-router-dom'],
                motion: ['framer-motion'],
                gsap: ['gsap'],
                scroll: ['lenis'],
              },
            },
          },
        },
  };
});
