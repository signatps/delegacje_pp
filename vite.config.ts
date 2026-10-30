import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import process from "node:process";

const host = process.env.TAURI_DEV_HOST;
const isTauri = Boolean(process.env.TAURI_ENV_PLATFORM);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: isTauri ? 1420 : 14347,
    strictPort: true,
    host: host || "127.0.0.1",
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  preview: {
    port: 14347,
    host: "127.0.0.1",
  },
  optimizeDeps: {
    include: ["sql.js"],
  },
  assetsInclude: ["**/*.wasm"],
});
