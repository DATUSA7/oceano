import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './src/main.js',
      name: 'Datusa3D', // Este será el nombre del objeto global
      fileName: 'datusa-cubo',
      formats: ['umd'] // Formato universal para navegadores
    }
  }
});