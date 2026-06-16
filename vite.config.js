import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "TrackWise",
        short_name: "TW",
        description: "Personal finance and expense tracking application",
        theme_color: "#0F172A",
        background_color: "#0F172A",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "trackwise-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "trackwise-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
        ],
      },
    }),
  ],
});