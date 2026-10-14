import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const dataRoot = fileURLToPath(new URL('../data', import.meta.url))

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@data': dataRoot,
    },
  },
  server: {
    fs: {
      // Allow importing marketing diagnostic content from ../data
      allow: [repoRoot, dataRoot],
    },
    // Produktly blocks Origin: localhost (403). Proxy API calls in dev with a
    // production Origin so feedback widgets work on http://localhost:5173.
    proxy: {
      "/__produktly_api": {
        target: "https://api.produktly.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/__produktly_api/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("Origin", "https://app.betterlsat.com")
            proxyReq.setHeader("Referer", "https://app.betterlsat.com/")
          })
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
