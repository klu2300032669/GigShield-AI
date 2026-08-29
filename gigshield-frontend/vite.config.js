import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Warn at 600KB chunks instead of default 500KB
    chunkSizeWarningLimit: 600,
  },
})
