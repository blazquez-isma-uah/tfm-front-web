import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // El proxy de VITE replica el comportamiento de Nginx en desarrollo, 
      // redirigiendo las llamadas a /api al gateway backend en localhost:8085
      '/api': {
        target: 'http://localhost:8085',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
