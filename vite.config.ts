import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { resolve } from "node:path";

// Popup is a normal Vite/React app and gets code-split/hashed assets like
// any other web app. The background service worker and content script are
// built separately (scripts/build-extension.mjs) as single self-contained
// IIFE bundles, since Manifest V3 content scripts cannot use ES module
// imports the way a webpage can.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(import.meta.dirname, "popup.html"),
      },
    },
  },
});
