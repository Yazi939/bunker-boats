import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Check if HMR is disabled via environment variable
const disableHmr = process.env.VITE_DISABLE_HMR === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  root: resolve(__dirname, '.'),
  publicDir: resolve(__dirname, 'public'),
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    target: 'chrome95',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'public/index.html'),
        preload: resolve(__dirname, 'src/preload/preload.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[ext]'
      }
    }
  },
  server: {
    port: 5174,
    strictPort: true,
    // Временно отключаем CSP для тестирования
    // headers: {
    //   'Content-Security-Policy': [
    //     "default-src 'self' http://localhost:* ws://localhost:* http://89.169.170.164:*",
    //     "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*",
    //     "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    //     "img-src 'self' data: blob: http://localhost:* https:",
    //     "font-src 'self' data: https://fonts.gstatic.com",
    //     "connect-src 'self' ws://localhost:* http://localhost:* http://89.169.170.164:* https:",
    //     "worker-src 'self' blob:",
    //     "frame-src 'self'"
    //   ].join('; ')
    // },
    watch: {
      usePolling: true,
      interval: 100
    },
    hmr: !disableHmr && {
      protocol: 'ws',
      host: 'localhost',
      port: 5174,
      clientPort: 5174,
      timeout: 5000
    }
  },
  define: {
    '__ELECTRON_DEV__': JSON.stringify(true),
    '__DISABLE_HMR__': JSON.stringify(disableHmr),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  optimizeDeps: {
    exclude: ['electron'],
    include: ['react', 'react-dom', 'antd']
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
}); 