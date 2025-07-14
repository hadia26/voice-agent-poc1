import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0', // 👈 This is CRUCIAL
    port: 5173,
    origin: 'https://concrete-duck-sharply.ngrok-free.app',
    allowedHosts: [
  'concrete-duck-sharply.ngrok-free.app',
  'relieved-grouse-simply.ngrok-free.app', // ✅ Add this too
],
    proxy: {
      '/transcribe-and-respond': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
    middlewareMode: false, // Ensure we're using full dev server
    headers: {
      'Access-Control-Allow-Origin': '*', // optional
    },
  },
});
