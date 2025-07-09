/// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,         // ✅ Habilita `expect`, `describe`, etc. sin importar
    environment: 'jsdom',  // ✅ Necesario para pruebas de React
    setupFiles: ['./vitest.setup.js'], // ✅ Config global como jest-dom
  },
});
