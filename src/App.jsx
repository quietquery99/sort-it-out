import { useEffect, useState } from 'react'
import { useTheme } from './hooks/useTheme'
import Nav from './components/Nav'
import Home from './components/Home'
import Disposal from './components/Disposal'
import DisposalCatalog from './components/DisposalCatalog'
import { catalog, itemsById } from './data/disposal'
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

const itemFromUrl = () => new URLSearchParams(window.location.search).get('item')
const updateItemUrl = id => {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set('item', id)
  else url.searchParams.delete('item')
  if (url.href !== window.location.href) window.history.replaceState(null, '', url)
}

export default function App() {
  const [tab, setTab] = useState(() => itemsById.has(itemFromUrl()) ? 'sort' : 'home')
  const [query, setQuery] = useState('')         // search typed on Home
  const [mapLayer, setMapLayer] = useState(null) // layer chosen from another tab
  const [openId, setOpenId] = useState(itemFromUrl)
  const [voice, setVoice] = useState(false)      // is Sorty's panel open?
  const [guideId, setGuideId] = useState(null)   // item whose guide page is open, e.g. "clothes"
  const [theme, toggleTheme] = useTheme()
  useEffect(() => {
    const onPopState = () => {
      const id = itemFromUrl()
      if (itemsById.has(id)) { setOpenId(id); setQuery(''); setTab('sort') }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const top = () => window.scrollTo(0, 0)
  const go = id => { updateItemUrl(null); setQuery(''); setMapLayer(null); setOpenId(null); setTab(id); top() }
  const search = q => { updateItemUrl(null); setQuery(q); setOpenId(null); setTab('sort'); top() }
  const openMap = layer => { updateItemUrl(null); setMapLayer(layer); setTab('map'); top() }
  const openItem = id => { updateItemUrl(itemsById.has(id) ? id : null); setOpenId(id); setQuery(''); setTab('sort'); top() }
  const openGuide = id => { updateItemUrl(null); setGuideId(id); setTab('guide'); top() }

  return (
    <>
      {/* A guide page belongs to Disposal, so keep that tab highlighted while it's open. */}
      <Nav tab={tab === 'guide' ? 'sort' : tab} onTab={go} theme={theme} onToggleTheme={toggleTheme} />
      <main>
        {tab === 'home' && <Home onSearch={search} onMap={openMap} onItem={openItem} onTab={go} onSorty={() => setVoice(true)} />}
        {tab === 'sort' && (catalog.items.length && (!openId || itemsById.has(openId))
          ? <DisposalCatalog key={query + (openId || '')} initial={query} initialId={openId} onMap={openMap} onItemUrl={updateItemUrl} />
          : <Disposal key={query + (openId || '')} initial={query} initialId={openId} onTab={go} onMap={openMap} onGuide={openGuide} />)}
        {tab === 'guide' && <Guide id={guideId} onBack={() => openItem(guideId)} onMap={openMap} />}
        {tab === 'donate' && <Donate onMap={openMap} />}
        {tab === 'map' && <MapView key={JSON.stringify(mapLayer)} presetLayer={typeof mapLayer === 'string' ? mapLayer : null}
          presetDisposal={mapLayer?.ruleId ? mapLayer : null} presetDonation={mapLayer?.donation} onOpenItem={openItem} theme={theme} />}
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
