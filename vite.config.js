import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { generate: generateMaps, MAPS_DIR } = require('./scripts/generate-maps-manifest.cjs')

// Keeps src/mapsGenerated.js in step with public/Maps, so dropping a map file in
// makes it appear in the picker without anyone editing a registry.
function mapsManifestPlugin() {
  return {
    name: 'syntarion-maps-manifest',
    buildStart() {
      generateMaps()
    },
    configureServer(server) {
      generateMaps()
      server.watcher.add(MAPS_DIR)
      const onMapChange = (file) => {
        if (!file.startsWith(MAPS_DIR)) return
        const { changed, count } = generateMaps()
        // Writing the module is enough for HMR to pick it up; the log just makes
        // it obvious in the terminal that a dropped file was noticed.
        if (changed) server.config.logger.info(`  maps manifest updated — ${count} map(s)`)
      }
      server.watcher.on('add', onMapChange)
      server.watcher.on('unlink', onMapChange)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mapsManifestPlugin()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})
