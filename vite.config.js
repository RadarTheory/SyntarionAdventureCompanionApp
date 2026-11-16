import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'node:module'
import { syncConstellation, CONSTELLATION_DIR } from './scripts/sync-constellation.mjs'

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

// The constellation's source is constellation/; public/constellation/ is generated from it so the iframe can load it.
function constellationPlugin() {
  return {
    name: 'syntarion-constellation',
    buildStart() {
      syncConstellation()
    },
    configureServer(server) {
      syncConstellation()
      server.watcher.add(CONSTELLATION_DIR)
      let timer
      const onChange = (file) => {
        if (!file.startsWith(CONSTELLATION_DIR)) return
        clearTimeout(timer)
        timer = setTimeout(() => {
          const files = syncConstellation()
          server.config.logger.info(`  constellation synced — ${files} entries`)
        }, 150)
      }
      server.watcher.on('change', onChange)
      server.watcher.on('add', onChange)
      server.watcher.on('unlink', onChange)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), mapsManifestPlugin(), constellationPlugin()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
})
