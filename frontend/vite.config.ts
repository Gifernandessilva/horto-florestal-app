import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'App Horto Florestal',
        short_name: 'Horto App',
        theme_color: '#121A13',
        background_color: '#121A13',
        display: 'standalone',
      },
    }),
  ],
})