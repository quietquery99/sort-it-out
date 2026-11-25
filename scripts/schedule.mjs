// Turns DSNY's schedule text into something the calendar can use.
//   "Friday and Saturday (Start Time: 9:00 AM - End Time: 1:00 PM)" + "April - October"
//   -> { days: [5, 6], start: '09:00', end: '13:00', from: 4, to: 10 }
// days: 0 = Sunday ... 6 = Saturday. from/to: months 1-12 (left out when it's year round).
// nth: for "Every 3rd Saturday of the month" -> 3.
// start/end are left out when the times differ by day ("Friday 8:00 AM, Saturday 12:00 PM ...");
// the calendar then shows the site's hours text instead.
// Returns null when the days can't be read, or when the site is always open (24/7, every day),
// because those aren't events. Those sites still show on the map, just not on the calendar.

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
const NTH = { '1st': 1, first: 1, '2nd': 2, second: 2, '3rd': 3, third: 3, '4th': 4, fourth: 4 }

// "9:00 AM" -> "09:00", "3:00 PM" -> "15:00"
function to24(t) {
  const m = t.match(/(\d{1,2})(?::(\d{2}))?\s*([AP])M/i)
  if (!m) return null
  let h = Number(m[1]) % 12
  if (m[3].toUpperCase() === 'P') h += 12
  return `${String(h).padStart(2, '0')}:${m[2] || '00'}`
}

export function parseSchedule(dayHours, openMonths) {
  const text = String(dayHours || '')
  if (/24\/7|every day|alternating/i.test(text)) return null

  // The time range: "Start Time: 10:00 AM - End Time: 3:00 PM"
  const t = text.match(/Start Time:\s*(\d{1,2}(?::\d{2})?\s*[AP]M)\s*-\s*End Time:\s*(\d{1,2}(?::\d{2})?\s*[AP]M)\s*\)/i)
  const start = t ? to24(t[1]) : null, end = t ? to24(t[2]) : null

  // The days: the part before "(", e.g. "Monday - Friday" or "Sun& Weds"
  const dayText = text.split('(')[0].toLowerCase().replace(/month/g, '')   // so "month" isn't read as "Mon"
  const found = [...dayText.matchAll(/(sun|mon|tue|wed|thu|fri|sat)[a-z]*/g)].map(m => DAYS.indexOf(m[1]))
  if (!found.length) return null
  let days = found
  if (found.length === 2 && /\s-\s|through|to /.test(dayText)) {   // a range like "Monday - Friday"
    days = []
    for (let d = found[0]; ; d = (d + 1) % 7) { days.push(d); if (d === found[1]) break }
  }
  days = [...new Set(days)].sort()
  if (days.length === 7) return null   // open every day: not an event

  const schedule = start ? { days, start, end } : { days }
  const nth = dayText.match(/1st|2nd|3rd|4th|first|second|third|fourth/)
  if (nth) schedule.nth = NTH[nth[0]]

  // The months: "April - October" (left out for "Year Round")
  const months = [...String(openMonths || '').toLowerCase().matchAll(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/g)].map(m => MONTHS.indexOf(m[1]) + 1)
  if (months.length === 2) { schedule.from = months[0]; schedule.to = months[1] }
  return schedule
}
