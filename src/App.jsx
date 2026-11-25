import { useState } from 'react'
import { useTheme } from './hooks/useTheme'
import Nav from './components/Nav'
import Home from './components/Home'
import Disposal from './components/Disposal'
import Donate from './components/Donate'
import MapView from './components/MapView'
import Pickup from './components/Pickup'
import Report from './components/Report'
import Learn from './components/Learn'
import Boards from './components/Boards'
import Guide from './components/Guide'
import Events from './components/Events'
import Sorty from './components/Sorty'
import VoicePanel from './components/VoicePanel'

export default function App() {
  const [tab, setTab] = useState('home')
  const [query, setQuery] = useState('')         // search typed on Home
  const [mapLayer, setMapLayer] = useState(null) // layer chosen from another tab
  const [openId, setOpenId] = useState(null)     // rule chosen from Sorty
  const [voice, setVoice] = useState(false)      // is Sorty's panel open?
  const [guideId, setGuideId] = useState(null)   // item whose guide page is open, e.g. "clothes"
  const [theme, toggleTheme] = useTheme()

  const top = () => window.scrollTo(0, 0)
  const go = id => { setQuery(''); setMapLayer(null); setOpenId(null); setTab(id); top() }
  const search = q => { setQuery(q); setOpenId(null); setTab('sort'); top() }
  const openMap = layer => { setMapLayer(layer); setTab('map'); top() }
  const openItem = id => { setOpenId(id); setQuery(''); setTab('sort'); top() }
  const openGuide = id => { setGuideId(id); setTab('guide'); top() }

  return (
    <>
      {/* A guide page belongs to Disposal, so keep that tab highlighted while it's open. */}
      <Nav tab={tab === 'guide' ? 'sort' : tab} onTab={go} theme={theme} onToggleTheme={toggleTheme} />
      <main>
        {tab === 'home' && <Home onSearch={search} onTab={go} onSorty={() => setVoice(true)} />}
        {tab === 'sort' && <Disposal key={query + (openId || '')} initial={query} initialId={openId} onTab={go} onMap={openMap} onGuide={openGuide} />}
        {tab === 'guide' && <Guide id={guideId} onBack={() => openItem(guideId)} onMap={openMap} />}
        {tab === 'donate' && <Donate onMap={openMap} />}
        {tab === 'map' && <MapView key={String(mapLayer)} presetLayer={mapLayer} theme={theme} />}
        {tab === 'pickup' && <Pickup />}
        {tab === 'events' && <Events />}
        {tab === 'report' && <Report />}
        {tab === 'learn' && <Learn />}
        {tab === 'boards' && <Boards />}
      </main>

      <footer className="foot">
        <button onClick={() => go('boards')}>For community boards &amp; officials</button>
      </footer>

      {voice && <VoicePanel onClose={() => setVoice(false)} onOpenItem={openItem} />}
      {tab !== 'home' && !voice && <Sorty onClick={() => setVoice(true)} />}
    </>
  )
}