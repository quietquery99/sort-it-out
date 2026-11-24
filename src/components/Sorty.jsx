import { Mic } from 'lucide-react'

// Sorty's drawing. Used on the home rooftop, in the voice panel, and on the floating button.
export function SortyArt({ size = 72 }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <path d="M16 33 V37 M21 33 V37" stroke="#F2A33A" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="18" cy="24" rx="12" ry="9" fill="#8C93A6" />
      <circle cx="29" cy="14" r="6" fill="#6E768C" />
      <path d="M34 14 L39 16 L34 17Z" fill="#F2A33A" />
      <circle cx="30" cy="13" r="1.5" fill="#fff" />
      <circle cx="30.3" cy="13" r=".7" fill="#111" />
      <path d="M8 22 Q16 31 24 22" fill="#5F667C" />
      <rect x="14" y="20" width="9" height="9" rx="2" fill="#23904F" />
      <path d="M14 24.5 H23" stroke="#fff" strokeWidth="1.2" />
    </svg>
  )
}

// Floating button that opens the voice panel (shown on every tab except Home).
export default function Sorty({ onClick }) {
  return (
    <div className="sorty">
      <button className="sorty-btn" onClick={onClick} aria-label="Talk to Sorty the pigeon">
        <SortyArt />
        <span className="micbadge"><Mic size={13} aria-hidden="true" /></span>
      </button>
    </div>
  )
}