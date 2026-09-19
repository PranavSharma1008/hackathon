import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const cleanExitPlugin = () => ({
  name: 'clean-exit',
  configureServer(server) {
    const handleExit = () => {
      try {
        server.httpServer?.close();
      } catch {}
      process.exit(0);
    };
    process.on('SIGINT', handleExit);
    process.on('SIGTERM', handleExit);
    process.on('SIGHUP', handleExit);
  }
});

export default defineConfig({
  plugins: [react(), cleanExitPlugin()],
  server: {
    port: 3002,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      }
    }
  },
  preview: {
    port: 3002,
    strictPort: true,
  }
});
