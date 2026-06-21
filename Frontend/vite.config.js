import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['maskan no name logo.png', 'Maskan logo.svg', 'home-hero.webp'],
      manifest: {
        name: 'Maskan — Location immobilière',
        short_name: 'Maskan',
        description: 'Plateforme de location entre particuliers en Tunisie',
        theme_color: '#B8622A',
        background_color: '#2A1A0E',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/maskan-xzpw\.onrender\.com\/api\/(listings|properties\/search|health).*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'maskan-api-public',
              expiration: { maxEntries: 32, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /^https:\/\/maskan-xzpw\.onrender\.com\/api\/.*/i,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'maskan-cloudinary',
              expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react')) return 'react-vendor'
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/lucide-react')) return 'ui-vendor'
          if (id.includes('node_modules/axios')) return 'axios-vendor'
          if (id.includes('/admin/pages/')) return 'admin'
          if (id.includes('/pages/') && (id.includes('Property') || id.includes('Booking') || id.includes('Verification') || id.includes('Report'))) return 'features'
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: false,
  },
})
