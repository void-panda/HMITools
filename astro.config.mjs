import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['pdf-lib', 'jszip', 'papaparse', 'qrcode', 'tesseract.js'],
    },
    ssr: {
      noExternal: ['pdf-lib', 'jszip', 'papaparse'],
    },
  },
});
