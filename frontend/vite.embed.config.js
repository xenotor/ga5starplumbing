/**
 * Second build: the standalone booking embed for landing pages that are not
 * this app. See docs/booking-module.md.
 *
 * It is a separate build rather than a second entry in vite.config.js because
 * a foreign page gets no help from our index.html: it needs its own stylesheet,
 * and both filenames have to stay unhashed so other sites can reference them by
 * name forever.
 *
 * React is a peer dependency, not bundled — a host page that already runs React
 * would otherwise load a second copy. Pages without React supply it with an
 * import map; see docs/booking-module.md.
 */

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Lib mode leaves NODE_ENV to the consumer, which would ship React's
  // development build — 4x the bytes over a plumber's mobile connection.
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: 'dist',
    // The SPA build runs first and owns dist/; this one adds to it.
    emptyOutDir: false,
    lib: {
      entry: resolve(root, 'src/booking/embed.jsx'),
      formats: ['es'],
      fileName: () => 'booking-embed.js',
    },
    cssCodeSplit: false,
    rollupOptions: {
      external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
      output: { assetFileNames: 'booking-embed[extname]' },
    },
  },
})
