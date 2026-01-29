import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Don't empty the dist directory - we need extension.js there too
    emptyOutDir: false,
  },
  server: {
    // Configure fallback for SPA routing
  },
})
