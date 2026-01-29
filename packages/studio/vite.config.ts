import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Don't empty the dist directory - we need extension.js there too
    emptyOutDir: false,
    // Keep consistent filenames in dev mode for easier debugging
    rollupOptions: {
      output: {
        entryFileNames: mode === 'development' ? 'assets/[name].js' : 'assets/[name]-[hash].js',
        chunkFileNames: mode === 'development' ? 'assets/[name].js' : 'assets/[name]-[hash].js',
        assetFileNames: mode === 'development' ? 'assets/[name][extname]' : 'assets/[name]-[hash][extname]',
      },
    },
  },
  server: {
    // Configure fallback for SPA routing
  },
}))
