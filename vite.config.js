import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { configDefaults } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "PontoVet",
        short_name: "PontoVet",
        theme_color: "#8A3FFC",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        lang: "pt-BR",
        icons: [
          { src: "/icone-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icone-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  // A pasta e2e/ é do Playwright; o Vitest (npm test) não deve rodar esses arquivos
  test: { exclude: [...configDefaults.exclude, "e2e/**"] },
});
