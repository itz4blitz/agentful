// vitest.config.js
import { defineConfig } from "file:///Users/blitz/Development/agentful/node_modules/vitest/dist/config.js";
import path from "path";
import { fileURLToPath } from "url";
var __vite_injected_original_import_meta_url = "file:///Users/blitz/Development/agentful/vitest.config.js";
var __dirname = path.dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var vitest_config_default = defineConfig({
  test: {
    // Test environment
    environment: "node",
    // Global setup and teardown
    globals: true,
    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      include: ["lib/**/*.js", "bin/**/*.js"],
      exclude: [
        "node_modules/**",
        "test/**",
        "docs/**",
        "template/**",
        ".claude/**",
        ".agentful/**",
        "bin/hooks/**"
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    },
    // Test file patterns
    include: [
      "test/**/*.test.js",
      "test/**/*.spec.js"
    ],
    // Setup files
    setupFiles: [],
    // Timeouts
    testTimeout: 1e4,
    hookTimeout: 1e4,
    // Reporters
    reporters: ["verbose"],
    // Aliases for imports
    alias: {
      "@": path.resolve(__dirname, "./lib"),
      "@test": path.resolve(__dirname, "./test")
    },
    // Isolation
    isolate: true,
    // Pool options
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: false
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./lib"),
      "@test": path.resolve(__dirname, "./test")
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIi9Vc2Vycy9ibGl0ei9EZXZlbG9wbWVudC9hZ2VudGZ1bFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL1VzZXJzL2JsaXR6L0RldmVsb3BtZW50L2FnZW50ZnVsL3ZpdGVzdC5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL1VzZXJzL2JsaXR6L0RldmVsb3BtZW50L2FnZW50ZnVsL3ZpdGVzdC5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlc3QvY29uZmlnJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ3VybCc7XG5cbmNvbnN0IF9fZGlybmFtZSA9IHBhdGguZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICB0ZXN0OiB7XG4gICAgLy8gVGVzdCBlbnZpcm9ubWVudFxuICAgIGVudmlyb25tZW50OiAnbm9kZScsXG5cbiAgICAvLyBHbG9iYWwgc2V0dXAgYW5kIHRlYXJkb3duXG4gICAgZ2xvYmFsczogdHJ1ZSxcblxuICAgIC8vIENvdmVyYWdlIGNvbmZpZ3VyYXRpb25cbiAgICBjb3ZlcmFnZToge1xuICAgICAgcHJvdmlkZXI6ICd2OCcsXG4gICAgICByZXBvcnRlcjogWyd0ZXh0JywgJ2pzb24nLCAnaHRtbCcsICdsY292J10sXG4gICAgICBpbmNsdWRlOiBbJ2xpYi8qKi8qLmpzJywgJ2Jpbi8qKi8qLmpzJ10sXG4gICAgICBleGNsdWRlOiBbXG4gICAgICAgICdub2RlX21vZHVsZXMvKionLFxuICAgICAgICAndGVzdC8qKicsXG4gICAgICAgICdkb2NzLyoqJyxcbiAgICAgICAgJ3RlbXBsYXRlLyoqJyxcbiAgICAgICAgJy5jbGF1ZGUvKionLFxuICAgICAgICAnLmFnZW50ZnVsLyoqJyxcbiAgICAgICAgJ2Jpbi9ob29rcy8qKidcbiAgICAgIF0sXG4gICAgICBhbGw6IHRydWUsXG4gICAgICBsaW5lczogODAsXG4gICAgICBmdW5jdGlvbnM6IDgwLFxuICAgICAgYnJhbmNoZXM6IDgwLFxuICAgICAgc3RhdGVtZW50czogODBcbiAgICB9LFxuXG4gICAgLy8gVGVzdCBmaWxlIHBhdHRlcm5zXG4gICAgaW5jbHVkZTogW1xuICAgICAgJ3Rlc3QvKiovKi50ZXN0LmpzJyxcbiAgICAgICd0ZXN0LyoqLyouc3BlYy5qcydcbiAgICBdLFxuXG4gICAgLy8gU2V0dXAgZmlsZXNcbiAgICBzZXR1cEZpbGVzOiBbXSxcblxuICAgIC8vIFRpbWVvdXRzXG4gICAgdGVzdFRpbWVvdXQ6IDEwMDAwLFxuICAgIGhvb2tUaW1lb3V0OiAxMDAwMCxcblxuICAgIC8vIFJlcG9ydGVyc1xuICAgIHJlcG9ydGVyczogWyd2ZXJib3NlJ10sXG5cbiAgICAvLyBBbGlhc2VzIGZvciBpbXBvcnRzXG4gICAgYWxpYXM6IHtcbiAgICAgICdAJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4vbGliJyksXG4gICAgICAnQHRlc3QnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi90ZXN0JylcbiAgICB9LFxuXG4gICAgLy8gSXNvbGF0aW9uXG4gICAgaXNvbGF0ZTogdHJ1ZSxcblxuICAgIC8vIFBvb2wgb3B0aW9uc1xuICAgIHBvb2w6ICdmb3JrcycsXG4gICAgcG9vbE9wdGlvbnM6IHtcbiAgICAgIGZvcmtzOiB7XG4gICAgICAgIHNpbmdsZUZvcms6IGZhbHNlXG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9saWInKSxcbiAgICAgICdAdGVzdCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3Rlc3QnKVxuICAgIH1cbiAgfVxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlSLFNBQVMsb0JBQW9CO0FBQ3RULE9BQU8sVUFBVTtBQUNqQixTQUFTLHFCQUFxQjtBQUY4SSxJQUFNLDJDQUEyQztBQUk3TixJQUFNLFlBQVksS0FBSyxRQUFRLGNBQWMsd0NBQWUsQ0FBQztBQUU3RCxJQUFPLHdCQUFRLGFBQWE7QUFBQSxFQUMxQixNQUFNO0FBQUE7QUFBQSxJQUVKLGFBQWE7QUFBQTtBQUFBLElBR2IsU0FBUztBQUFBO0FBQUEsSUFHVCxVQUFVO0FBQUEsTUFDUixVQUFVO0FBQUEsTUFDVixVQUFVLENBQUMsUUFBUSxRQUFRLFFBQVEsTUFBTTtBQUFBLE1BQ3pDLFNBQVMsQ0FBQyxlQUFlLGFBQWE7QUFBQSxNQUN0QyxTQUFTO0FBQUEsUUFDUDtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLEtBQUs7QUFBQSxNQUNMLE9BQU87QUFBQSxNQUNQLFdBQVc7QUFBQSxNQUNYLFVBQVU7QUFBQSxNQUNWLFlBQVk7QUFBQSxJQUNkO0FBQUE7QUFBQSxJQUdBLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBR0EsWUFBWSxDQUFDO0FBQUE7QUFBQSxJQUdiLGFBQWE7QUFBQSxJQUNiLGFBQWE7QUFBQTtBQUFBLElBR2IsV0FBVyxDQUFDLFNBQVM7QUFBQTtBQUFBLElBR3JCLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLFdBQVcsT0FBTztBQUFBLE1BQ3BDLFNBQVMsS0FBSyxRQUFRLFdBQVcsUUFBUTtBQUFBLElBQzNDO0FBQUE7QUFBQSxJQUdBLFNBQVM7QUFBQTtBQUFBLElBR1QsTUFBTTtBQUFBLElBQ04sYUFBYTtBQUFBLE1BQ1gsT0FBTztBQUFBLFFBQ0wsWUFBWTtBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBRUEsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsV0FBVyxPQUFPO0FBQUEsTUFDcEMsU0FBUyxLQUFLLFFBQVEsV0FBVyxRQUFRO0FBQUEsSUFDM0M7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
