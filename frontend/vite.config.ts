import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        /**
         * Split the vendor libraries out of the app chunk.
         *
         * They change far less often than the app does, so keeping them
         * separate means a normal deploy only invalidates the small app chunk
         * rather than making every visitor re-download ~500 kB of MUI.
         */
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          mui: ["@mui/material", "@emotion/react", "@emotion/styled"],
          "mui-icons": ["@mui/icons-material"],
        },
      },
    },
    // The vendor chunks are legitimately large; warn only on app chunks.
    chunkSizeWarningLimit: 600,
  },
});
