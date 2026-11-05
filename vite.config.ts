import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { VitePWA, type ManifestOptions } from "vite-plugin-pwa";
import manifest from "./public/manifest.json";

export default defineConfig({
  server: { host: "::", port: 8080 },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      manifestFilename: "manifest.json",
      manifest: manifest as Partial<ManifestOptions>,
      includeAssets: [
        "favicon.ico",
        "faviconDark.ico",
        "apple-touch-icon.png",
        "icon-192.png",
        "icon-512.png",
      ],
    }),
  ],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
