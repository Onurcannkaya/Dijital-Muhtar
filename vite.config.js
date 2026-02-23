import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Dijital Muhtar",
        short_name: "Muhtar",
        description: "Resmi belgelerinizi anında çözümleyen yapay zeka asistanı.",
        theme_color: "#ffffff",
        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      }
    })
  ],
  build: {
    target: "esnext",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          lucide: ["lucide-react"],
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ["tesseract.js"],
  },
  server: {
    port: 3000,
    host: true,
  },
});
