import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        contacto: resolve(import.meta.dirname, 'contacto.html'),
        tienda: resolve(import.meta.dirname, 'tienda.html'),
      },
    },
  },
});
