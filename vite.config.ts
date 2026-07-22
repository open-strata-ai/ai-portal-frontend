import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// NOTE: @openstrata/ai-ui-kit is not yet published to npm. For local verification
// we resolve it to the sibling source tree. Before production use, remove this
// alias, publish ai-ui-kit, and add it as a normal dependency.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@openstrata/ai-ui-kit': path.resolve(__dirname, 'ai-ui-kit-src/src/index.ts'),
      'mermaid': path.resolve(__dirname, 'mermaid-stub.mjs'),
    },
  },
  server: { port: 5173, proxy: { '/api': 'http://localhost:8092' } },
  // `mermaid` is an optional, lazily-loaded dependency of ai-ui-kit; the
  // MermaidRenderer degrades gracefully when it is absent.
  build: {
    rollupOptions: {
      external: ['mermaid'],
    },
  },
});
