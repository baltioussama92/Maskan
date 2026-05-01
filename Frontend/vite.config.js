import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules/react')) return 'react-vendor'
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/lucide-react')) return 'ui-vendor'
          if (id.includes('node_modules/axios')) return 'axios-vendor'
          // Admin pages chunk
          if (id.includes('/admin/pages/')) return 'admin'
          // Feature pages chunk (lazy-loaded routes)
          if (id.includes('/pages/') && (id.includes('Property') || id.includes('Booking') || id.includes('Verification') || id.includes('Report'))) return 'features'
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
  },
})
