// Sample pickup zones. Days: 0=Sunday ... 6=Saturday. Replace with a real DSNY schedule lookup later.
export const ZONES = [
  { name: 'Greenpoint / Williamsburg (CD 1)', match: 'green|willi',  trash: [1, 4], recycling: [2, 5], organics: [3] },
  { name: 'Downtown Brooklyn (CD 2)',         match: 'downtown|fulton|fort', trash: [2, 5], recycling: [3], organics: [1, 4] },
  { name: 'Bushwick (CD 4)',                  match: 'bush|myrtle',  trash: [1, 4], recycling: [3], organics: [2, 5] },
  { name: 'Hunts Point, Bronx (CD 2)',        match: 'hunts',        trash: [2, 5], recycling: [1], organics: [3] },
  { name: 'Jamaica, Queens (CD 12)',          match: 'jamaica',      trash: [3, 6], recycling: [2], organics: [1] },
]