import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    host: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        empresas: resolve(import.meta.dirname, 'empresas.html'),
        contacto: resolve(import.meta.dirname, 'contacto.html'),
        tienda: resolve(import.meta.dirname, 'tienda.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
      },
    },
  },
});
