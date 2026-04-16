import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        tailwindcss(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
          workbox: {
            maximumFileSizeToCacheInBytes: 4000000
          },
          manifest: {
            name: 'Mazamitla Delivery',
            short_name: 'Mazamitla',
            description: 'Tu comida favorita a domicilio en Mazamitla',
            theme_color: '#0c0a09',
            background_color: '#0c0a09',
            display: 'standalone',
            icons: [
              {
                src: 'https://cdn.jsdelivr.net/gh/lucide-icons/lucide/icons/palmtree.svg',
                sizes: '192x192',
                type: 'image/svg+xml'
              },
              {
                src: 'https://cdn.jsdelivr.net/gh/lucide-icons/lucide/icons/palmtree.svg',
                sizes: '512x512',
                type: 'image/svg+xml'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
