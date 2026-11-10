// Vite build settings. Owner: AI-1
import { defineConfig } from 'vite';

// base './' keeps asset paths relative, so the same build works on
// GitHub Pages (a sub-folder URL) and inside the Android WebView.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
});
