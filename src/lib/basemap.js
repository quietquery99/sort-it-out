const basemapKey = import.meta.env.VITE_CARTO_BASEMAP_KEY
const tileQuery = basemapKey ? `?key=${encodeURIComponent(basemapKey)}` : ''

// Dark map in dark mode, light map in light mode.
export const TILES = {
  light: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${tileQuery}`,
  dark: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${tileQuery}`,
}
