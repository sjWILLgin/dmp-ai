import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react/jsx-dev-runtime',
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'antd',
      '@ant-design/icons'
    ]
  },

  server: {
    host: true, // 允许外部访问（0.0.0.0）
    allowedHosts: ['q4f8bdca.natappfree.cc', 'j2d6bb65.natappfree.cc'], // 放行 natapp 域名
    port: 5173,
    strictPort: true
  }
})
