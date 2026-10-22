/**
 * Build da versão web de testes do Sales Copilot (react-native-web + Vite).
 *   npm run web:dev    → servidor local para desenvolvimento
 *   npm run web:build  → gera a pasta dist/ (estática, pronta para qualquer servidor)
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const webDir = path.dirname(fileURLToPath(import.meta.url));

// Arquivos .web.* (ex.: KeyboardBridge.web.ts, createMMKV.web.js) têm prioridade
const extensions = ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.json'];

export default defineConfig({
  root: webDir,
  // Caminhos relativos: a dist funciona em qualquer pasta do servidor
  base: './',
  plugins: [react()],
  define: {
    __DEV__: 'false',
    global: 'globalThis',
  },
  resolve: {
    alias: { 'react-native': 'react-native-web' },
    extensions,
  },
  optimizeDeps: {
    esbuildOptions: {
      resolveExtensions: extensions,
      loader: { '.js': 'jsx' },
    },
  },
  build: {
    outDir: path.resolve(webDir, '../dist'),
    emptyOutDir: true,
  },
});
