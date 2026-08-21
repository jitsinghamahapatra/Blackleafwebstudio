import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load environment variables including non-VITE_ variables from root folder
  const env = loadEnv(mode, process.cwd(), '');
  const apiPort = process.env.PORT || env.PORT || 5000;

  return {
    plugins: [react()],
    define: {
      'import.meta.env.FIREBASE_API_KEY': JSON.stringify(env.FIREBASE_API_KEY),
      'import.meta.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(env.FIREBASE_AUTH_DOMAIN),
      'import.meta.env.FIREBASE_PROJECT_ID': JSON.stringify(env.FIREBASE_PROJECT_ID),
      'import.meta.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(env.FIREBASE_STORAGE_BUCKET),
      'import.meta.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(env.FIREBASE_MESSAGING_SENDER_ID),
      'import.meta.env.FIREBASE_APP_ID': JSON.stringify(env.FIREBASE_APP_ID),
      'import.meta.env.FIREBASE_MEASUREMENT_ID': JSON.stringify(env.FIREBASE_MEASUREMENT_ID)
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${apiPort}`,
          changeOrigin: true,
          secure: false
        }
      }
    },
    build: {
      rollupOptions: {
        input: {
          main: 'index.html',
          admin: 'admin.html',
          services: 'services.html',
          portfolio: 'portfolio.html',
          contact: 'contact.html',
          profile: 'profile.html'
        }
      }
    }
  }
})