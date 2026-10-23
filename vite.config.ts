import { defineConfig } from 'vite';

export default defineConfig({
  clearScreen: false,
  server: { port: 5173, strictPort: true, watch: { ignored: ['**/src-tauri/**'] } },
  build: { target: 'chrome105' },
});
