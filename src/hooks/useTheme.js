import { useEffect, useState } from 'react'

const KEY = 'sortitout-theme'

// Use the saved choice if there is one, otherwise follow the device setting.
function initial() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch { /* storage can be blocked; ignore */ }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState(initial)

  useEffect(() => {
    document.documentElement.dataset.theme = theme   // the CSS reads this attribute
    try { localStorage.setItem(KEY, theme) } catch { /* ignore */ }
  }, [theme])

  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  return [theme, toggle]
}