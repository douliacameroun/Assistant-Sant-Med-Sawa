
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  },
  server: {
    port: 3000
  },
  // On mappe process.env pour que le SDK Gemini puisse y accéder directement
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
