import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'url';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.DIRECTUS_AUTH_URL': JSON.stringify(env.VITE_DIRECTUS_AUTH_URL),
        'process.env.DIRECTUS_CRM_URL': JSON.stringify(env.VITE_DIRECTUS_CRM_URL),
      },
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('./src', import.meta.url))
        }
      }
    };
});
