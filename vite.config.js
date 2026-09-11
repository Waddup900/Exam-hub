import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      selfDestroying: true, // Forces browser to unregister the service worker and wipe cached builds
      registerType: 'autoUpdate',
      manifest: {
        name: 'Your Exam Platform',
        short_name: 'ExamApp',
        display: 'standalone',
      }
    })
  ],
  build: {
    sourcemap: false
  }
})
