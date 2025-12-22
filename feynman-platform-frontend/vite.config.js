import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import cesium from 'vite-plugin-cesium';
import path from 'path'; // 导入 path 模块

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: ['framer-motion'],
  },
  plugins: [react(), cesium()],
  resolve: {
    alias: {
      'react': path.resolve(__dirname, 'node_modules/react'),
    },
  },
  server: {
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4500',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
