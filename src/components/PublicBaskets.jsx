import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'

const loaders = import.meta.glob('../data/baskets.json', { import: 'default' })

function BasketLayer({ baskets }) {
  const map = useMap()
  useEffect(() => {
    const layer = L.layerGroup().addTo(map)
    function draw() {
      layer.clearLayers()
      const bounds = map.getBounds()
      const zoom = map.getZoom()
      const cells = new Map()
      for (const [lat, lng, address, type] of baskets) {
        if (!bounds.contains([lat, lng])) continue
        const point = map.project([lat, lng], zoom)
        const key = zoom >= 17 ? lat + ',' + lng : Math.floor(point.x / 45) + ',' + Math.floor(point.y / 45)
        const cell = cells.get(key)
        if (cell) { cell.count++; cell.lat += lat; cell.lng += lng }
        else cells.set(key, { count: 1, lat, lng, address, type })
      }
      for (const cell of cells.values()) {
        const center = [cell.lat / cell.count, cell.lng / cell.count]
        const label = cell.count > 1 ? cell.count + ' litter baskets' : [cell.type || 'Public litter basket', cell.address].filter(Boolean).join(' · ')
        const text = document.createElement('span')
        text.textContent = label
        const marker = L.circleMarker(center, { radius: cell.count > 1 ? 9 : 5, color: '#076a68', fillOpacity: .8, weight: 2 }).addTo(layer)
        if (cell.count > 1 && zoom < 17) marker.bindTooltip(text).on('click', () => map.setView(center, zoom + 2))
        else marker.bindPopup(text)
      }
    }
    draw()
    map.on('moveend', draw)
    return () => { map.off('moveend', draw); layer.remove() }
  }, [map, baskets])
  return null
}

export default function PublicBaskets({ tileUrl }) {
  const [baskets, setBaskets] = useState(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true
    const load = loaders['../data/baskets.json']
    if (!load) { setFailed(true); return }
    load().then(data => { if (active) setBaskets(data) }).catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [])
  const status = failed ? 'Basket locations could not be loaded.' : baskets ? baskets.length.toLocaleString() + ' mapped baskets. Zoom in to see individual locations.' : 'Loading basket locations…'
  return <section aria-label="Public litter basket map">
    <p className="muted small" role="status">{status}</p>
    <MapContainer center={[40.72, -73.95]} zoom={11} className="basket-map">
      <TileLayer url={tileUrl} subdomains="abcd" maxZoom={19} attribution="© OpenStreetMap, © CARTO" />
      {baskets && <BasketLayer baskets={baskets} />}
    </MapContainer>
  </section>
}
