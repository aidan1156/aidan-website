import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // The site is served from a subpath (www.doc.ic.ac.uk/~ab2923/), so assets
  // have to be emitted relative. The gradient worker is loaded by URL and would
  // otherwise be requested from the server root and 404.
  base: './',
  plugins: [react()],
})
