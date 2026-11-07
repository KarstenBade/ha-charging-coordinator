import { defineConfig } from "vite";

// Builds a single ES module that the integration serves and registers itself.
export default defineConfig({
  build: {
    lib: {
      entry: "src/charging-coordinator-card.ts",
      formats: ["es"],
      fileName: () => "charging-coordinator-card.js",
    },
    outDir: "../custom_components/charging_coordinator/www",
    emptyOutDir: false,
    minify: true,
    sourcemap: false,
  },
});
