import {defineConfig} from 'vite';
import string from 'vite-plugin-string';
import react from '@vitejs/plugin-react';
import tailwindcss from "@tailwindcss/vite";
import path from "path";


// eslint-disable-next-line no-empty-pattern
export default defineConfig(({}) =>
{
  const base = '/'

  return {
    plugins: [
      tailwindcss(),
      react(),
      string({
        include: '**/*.wgsl',
        compress: false,
      }),
    ],
    base: base,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    },

    build: {
      target: 'esnext',
    },


    optimizeDeps: {
      include: ['react', 'react-dom', 'react-icons', 'react-icons/*', 'monaco-editor'],
    }
  }
});