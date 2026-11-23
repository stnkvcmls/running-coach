/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const norm = id.replace(/\\/g, '/')
          if (!norm.includes('node_modules/')) return
          // React must not be hoisted into "charts" (recharts depends on it),
          // or the landing page would download the chart code just for React.
          if (/node_modules\/(react|react-dom|scheduler)\//.test(norm)) return 'react'
          if (
            norm.includes('node_modules/recharts') ||
            norm.includes('node_modules/d3-') ||
            norm.includes('node_modules/victory-vendor')
          ) {
            return 'charts'
          }
          if (
            norm.includes('node_modules/react-markdown') ||
            norm.includes('node_modules/remark-') ||
            norm.includes('node_modules/rehype-') ||
            norm.includes('node_modules/micromark') ||
            norm.includes('node_modules/mdast-') ||
            norm.includes('node_modules/hast-') ||
            norm.includes('node_modules/unist-') ||
            norm.includes('node_modules/unified') ||
            norm.includes('node_modules/vfile') ||
            norm.includes('node_modules/property-information') ||
            norm.includes('node_modules/character-entities') ||
            norm.includes('node_modules/decode-named-character-reference')
          ) {
            return 'markdown'
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
})
