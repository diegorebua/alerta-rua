import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({mode}) => {
  const env = process.env.ONEPASSWORD_ACTIVE === '1' ? process.env : loadEnv(mode, '.', '');
  return {
    envDir: process.env.ONEPASSWORD_ACTIVE === '1' ? false : undefined,
    plugins: [react(), tailwindcss(), cloudflare()],
    define: {
      // Expõe a API key do Google Maps e Clerk no bundle de produção
      'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY || ''),
      'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(env.VITE_CLERK_PUBLISHABLE_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
