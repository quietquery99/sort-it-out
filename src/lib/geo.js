// Distance in miles between two [lat, lng] points (haversine formula).
export function distMiles(a, b) {
  const R = 3958.8, rad = x => (x * Math.PI) / 180
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Link that opens transit directions in the user's maps app.
export const directionsUrl = s =>
  `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}&travelmode=transit`

// Ask the browser for the user's location. Calls ok([lat, lng]) or fail(message).
export function locate(ok, fail) {
  if (!navigator.geolocation) { fail('Location isn’t available in this browser.'); return }
  navigator.geolocation.getCurrentPosition(
    p => ok([p.coords.latitude, p.coords.longitude]),
    () => fail('Couldn’t get your location. Check your browser’s permission.'),
    { timeout: 10000 },
  )
}