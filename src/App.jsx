import { useState } from 'react'
import Sort from './components/Sort'
import MapView from './components/MapView'
import Schedule from './components/Schedule'
import Districts from './components/Districts'
import Briefs from './components/Briefs'

const TABS = [
  ['sort', 'What goes where'],
  ['map', 'Map'],
  ['when', 'Pickup days'],
  ['data', 'District explorer'],
  ['brief', 'Briefs & mailers'],
]

export default function App() {
  const [tab, setTab] = useState('sort')
  const [mapLayer, setMapLayer] = useState(null) // set when arriving from a search result

  const go = id => { setMapLayer(null); setTab(id) }
  const findOnMap = layer => { setMapLayer(layer); setTab('map') }

  return (
    <>
      <header className="topbar">
        <div className="logo">SortItOut <span className="tag">Brooklyn pilot</span></div>
        <nav>
          {TABS.map(([id, label]) => (
            <button key={id} className={tab === id ? 'on' : ''} onClick={() => go(id)}>{label}</button>
          ))}
        </nav>
      </header>
      <main>
        {tab === 'sort' && <Sort onFindOnMap={findOnMap} />}
        {tab === 'map' && <MapView key={String(mapLayer)} presetLayer={mapLayer} />}
        {tab === 'when' && <Schedule />}
        {tab === 'data' && <Districts />}
        {tab === 'brief' && <Briefs />}
      </main>
    </>
  )
}