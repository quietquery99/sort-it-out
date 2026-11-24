import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { TABS } from '../data/tabs'

// Centered pill menu on computers; bottom bar with "More" on phones.
export default function Nav({ tab, onTab, theme, onToggleTheme }) {
  const [more, setMore] = useState(false)
  const main = TABS.slice(0, 5)
  const extra = TABS.slice(5)
  const go = id => { setMore(false); onTab(id) }

  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => go('home')}>
          <span className="logo3" aria-hidden="true"><i /><i /><i /></span>
          SortItOut <span className="tag">Brooklyn pilot</span>
        </button>

        <nav className="tabs-desktop" aria-label="Main">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} className={'tab' + (tab === id ? ' on' : '')} onClick={() => go(id)} aria-current={tab === id ? 'page' : undefined} title={label}>
              <Icon size={17} aria-hidden="true" /><span className="lbl">{label}</span>
            </button>
          ))}
        </nav>

        <button className="theme-switch" onClick={onToggleTheme} role="switch" aria-checked={theme === 'dark'} aria-label="Dark mode">
          <span className="knob" />
          <Sun size={15} className="s" aria-hidden="true" />
          <Moon size={15} className="m" aria-hidden="true" />
        </button>
      </header>

      <nav className="tabs-mobile" aria-label="Main">
        {main.map(({ id, label, Icon }) => (
          <button key={id} className={'mtab' + (tab === id ? ' on' : '')} onClick={() => go(id)}>
            <Icon size={20} aria-hidden="true" />{label}
          </button>
        ))}
        <button className={'mtab' + (extra.some(t => t.id === tab) || more ? ' on' : '')} onClick={() => setMore(m => !m)}>
          <span className="dots" aria-hidden="true">•••</span>More
        </button>
      </nav>

      {more && (
        <div className="more-sheet">
          {extra.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => go(id)}><Icon size={18} aria-hidden="true" />{label}</button>
          ))}
        </div>
      )}
    </>
  )
}