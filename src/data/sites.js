// Sample drop-off sites for the prototype. VERIFY every entry before launch.
// Row format: [name, layer, borough, district, lat, lng, hours, accepts, address]
const rows = [
  ['McCarren Park Greenmarket', 'compost', 'Brooklyn', 'CD 1', 40.7208, -73.9517, 'Sat 8am–3pm', 'Food scraps', 'Lorimer St & Driggs Ave'],
  ['Maria Hernandez Park Greenmarket', 'compost', 'Brooklyn', 'CD 4', 40.7025, -73.9207, 'Sat 8am–2pm (seasonal)', 'Food scraps', 'Knickerbocker Ave & Starr St'],
  ['Fort Greene Park Greenmarket', 'compost', 'Brooklyn', 'CD 2', 40.6900, -73.9737, 'Sat 8am–5pm', 'Food scraps', 'DeKalb Ave & Washington Park'],
  ['Grand Army Plaza Greenmarket', 'compost', 'Brooklyn', 'CD 6', 40.6727, -73.9701, 'Sat 8am–4pm', 'Food scraps', 'Prospect Park W & Flatbush Ave'],
  ['Rocking the Boat compost hub', 'compost', 'Bronx', 'CD 2', 40.8115, -73.8807, 'Call ahead', 'Food scraps, garden waste', 'Hunts Point'],
  ['Jamaica community garden drop-off', 'compost', 'Queens', 'CD 12', 40.7040, -73.7952, 'Sat 9am–1pm', 'Food scraps', 'Jamaica'],
  ['Big Reuse Gowanus', 'textile', 'Brooklyn', 'CD 6', 40.6745, -73.9905, 'Check website', 'Furniture, paint, building materials, books', 'Gowanus'],
  ['Housing Works Thrift Shop', 'textile', 'Brooklyn', 'CD 6', 40.6742, -73.9776, 'Daily 10am–7pm', 'Clothing, housewares, books', 'Park Slope'],
  ['Greenpoint textile bin', 'textile', 'Brooklyn', 'CD 1', 40.7270, -73.9510, 'Daily', 'Clean clothing and shoes', 'Manhattan Ave'],
  ['Bushwick clothing reuse bin', 'textile', 'Brooklyn', 'CD 4', 40.7060, -73.9230, 'Daily', 'Clean clothing and shoes', 'Bushwick'],
  ['Hunts Point reuse bin', 'textile', 'Bronx', 'CD 2', 40.8130, -73.8850, 'Daily', 'Clothing, shoes', 'Hunts Point'],
  ['ecycleNYC building program, Sunset Park', 'ecycle', 'Brooklyn', 'CD 7', 40.6560, -74.0090, 'Building enrollment', 'Laptops, phones, TVs (processed by ERI)', 'Sunset Park'],
  ['Downtown Brooklyn e-waste point', 'ecycle', 'Brooklyn', 'CD 2', 40.6920, -73.9857, 'Mon–Sat 10am–6pm', 'Small electronics, cables', 'Downtown Brooklyn'],
  ['Jamaica e-waste drop-off', 'ecycle', 'Queens', 'CD 12', 40.7000, -73.7970, 'Mon–Fri 9am–5pm', 'Electronics', 'Jamaica'],
  ['SAFE event site, Sunset Park', 'safe', 'Brooklyn', 'CD 7', 40.6531, -74.0046, 'Check monthly events', 'Batteries, paint, bulbs, solvents', 'Sunset Park'],
  ['SAFE event site, Greenpoint', 'safe', 'Brooklyn', 'CD 1', 40.7240, -73.9410, 'Check monthly events', 'Batteries, paint, bulbs, solvents', 'Greenpoint'],
  ['SAFE event site, Hunts Point', 'safe', 'Bronx', 'CD 2', 40.8100, -73.8830, 'Check monthly events', 'Batteries, paint, bulbs, solvents', 'Hunts Point'],
  ['SAFE event site, Jamaica', 'safe', 'Queens', 'CD 12', 40.7010, -73.8000, 'Check monthly events', 'Batteries, paint, bulbs, solvents', 'Jamaica'],
  ['Repair Café, Flatbush library', 'repair', 'Brooklyn', 'CD 14', 40.6480, -73.9590, '1st Sat 11am–3pm', 'Small appliances, clothes, bikes', 'Flatbush'],
  ['Bushwick repair & swap', 'repair', 'Brooklyn', 'CD 4', 40.7050, -73.9235, '2nd Sun noon–4pm', 'Clothes swap, repairs', 'Bushwick'],
  ['Downtown swap day', 'repair', 'Brooklyn', 'CD 2', 40.6930, -73.9850, 'Last Sat 10am–2pm', 'Books, clothes, housewares', 'Downtown Brooklyn'],
]

export const SITES = rows.map((r, i) => ({
  id: i, name: r[0], layer: r[1], borough: r[2], cd: r[3],
  lat: r[4], lng: r[5], hours: r[6], accepts: r[7], address: r[8],
}))