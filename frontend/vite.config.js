import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/login": "http://localhost:8000",
      "/logout": "http://localhost:8000",
      "/me": "http://localhost:8000",
      "/dashboard": "http://localhost:8000",
      "/orders": "http://localhost:8000",
      "/users": "http://localhost:8000",
      "/audit-logs": "http://localhost:8000",
      "/health": "http://localhost:8000",
    },
  },
  build: {
    outDir: "../backend/static",
    emptyOutDir: true,
  },
});
