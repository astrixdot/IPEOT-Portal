import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api/auth": process.env.IPEOT_AUTH_PROXY || "http://127.0.0.1:9991",
      "/api/crud": process.env.IPEOT_CRUD_PROXY || "http://127.0.0.1:3034",
      "/api/files": "http://127.0.0.1:5051",
    },
  },
  test: {
    environment: "node",
  },
});
