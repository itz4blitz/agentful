import { defineConfig } from 'vocs'

export default defineConfig({
  // Extend the vocs config from node_modules
  ...defineConfig({ base: './' }),

  // Add Pagefind plugin for local search
  vite: {
    plugins: [
      'pagefind'
    ],
  },
})
