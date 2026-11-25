import { House, Trash2, Gift, MapPin, CalendarDays, CalendarCheck, Flag, BookOpen } from 'lucide-react'

// The tabs. The first five show on the phone bottom bar; the rest go under "More".
export const TABS = [
  { id: 'home',   label: 'Home',     Icon: House },
  { id: 'sort',   label: 'Disposal', Icon: Trash2 },
  { id: 'donate', label: 'Donate',   Icon: Gift },
  { id: 'map',    label: 'Map',      Icon: MapPin },
  { id: 'pickup', label: 'Pickup',   Icon: CalendarDays },
  { id: 'events', label: 'Events',   Icon: CalendarCheck },
  { id: 'report', label: 'Report',   Icon: Flag },
  { id: 'learn',  label: 'Learn',    Icon: BookOpen },
]