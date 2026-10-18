import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // In development Vite forwards /api to FastAPI. In containers Nginx does this job.
    proxy: { "/api": "http://localhost:8000" },
  },
});
