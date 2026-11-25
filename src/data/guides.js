// Guide pages: informational reuse & repair pages for specific items.
//
// WHICH ITEMS GET A GUIDE PAGE
// ----------------------------
// If an item's id (from items.js) is a key in GUIDES below, clicking that item on the
// Disposal page opens its guide page instead of the pop-up.
// To give another item a page, copy one whole entry (from its id down to the matching
// closing  },  ) and change the text.
//
// THE PARTS OF A GUIDE
//   title:     the big heading at the top of the page.
//   intro:     a paragraph under the title.
//   fact:      optional. A short "did you know" fact, with its source.
//   sections:  informational blocks. Each one has:
//     heading: the section title.
//     points:  a list of paragraphs or sentences.
//     sites:   optional. Organizations, programs or events for this section. Each shows as a
//              square tile; clicking it opens a pop-up with the details. Fields (all optional except name):
//                name:    shown on the tile.
//                does:    what you can do there, as a list of keys from DOES below, e.g. ['repair', 'donate'].
//                address: street address (adds a Directions button).
//                hours:   opening hours, as you'd write them.
//                note:    a sentence or two about it. For several paragraphs, use a list:
//                         note: ['First paragraph.', 'Second paragraph.'],
//              A place with more than one location gets one entry per location, so each
//              gets its own Directions button.
//                href:    its website.
//
// "Where to take it" on the page is filled in automatically from the map's disposal sites,
// so you don't list drop-off locations here.

// What you can do at a site. The label is what shows on its tile and pop-up.
export const DOES = {
  donate:  'Donate',
  repair:  'Repair',
  reuse:   'Reuse',
  recycle: 'Recycle',
  swap:    'Swap',
  event:   'Event',
  learn:   'Learn',
}

export const GUIDES = {
  clothes: {
    title: 'Clothes',
    intro: `We all have clothes that no longer fit us (physically or metaphorically). The global
    textile industry produces over 92 million tons of waste every year, most of which ends up in a landfill!
    However, there are many ways in which you can reduce textile waste.`,
    fact: { text: '200000 tons of clothing, shoes, accessories, and linens are thrown out in NYC annually.'
      , source: 'FabScrap' },
    sections: [
      { heading: 'Before you throw it...', points:
        [`There are plenty of ways to upcycle clothes and bring them back to life!
          You can also attend repair and mending events around the city. Check out some of the
          options below.`],
        sites: [
          { name: 'DSNY Textile Recycling',
            does: [],
            href: 'https://www.nyc.gov/site/dsny/what-we-do/programs/textile-collection.page',
            note: 'TO WRITE',
          },
          { name: 'donateNYC',
            does: [],
            href: 'https://www.nyc.gov/assets/donate/site/home',
            note: 'TO WRITE',
          },
          { name: 'Big Reuse (Gowanus)',
            does: [],
            address: '1 12th Street, Brooklyn, NY 11215',
            hours: 'Open daily 10AM-7PM',
            href: 'https://bigreuse.org',
            note: `Big Reuse supports and builds community-based initiatives that minimize waste and
            cultivate a greener and more resilient future amid accelerating climate change.`,
          },
          { name: 'Big Reuse (Bushwick)',
            does: [],
            address: '378 Troutman Street, Brooklyn, NY 11237',
            hours: 'Open daily 11AM-7PM',
            href: 'https://bigreuse.org',
            note: `Big Reuse supports and builds community-based initiatives that minimize waste and
            cultivate a greener and more resilient future amid accelerating climate change.`,
          },
          { name: 'Fabscrap',
            does: [],
            address: '140 58th Street, Brooklyn NY 11220',
            hours: 'Tuesday - Friday, 9AM-5PM',
            href: 'https://fabscrap.org/',
            note: [
              `Fabscrap accepts all pre-consumer textile waste, including production scraps,
              headers, swatches, and unused yardage and bolts.`,
              'You can schedule a time to have your textiles picked up, or a time to drop them off, on their website.',
            ],
          },
        ],
      },
    ],
  },

  furniture: {
    title: 'Furniture',
    intro: 'TO WRITE',
    fact: { text: 'TO WRITE', source: 'TO WRITE' },
    sections: [
      { heading: 'TO WRITE', points: ['TO WRITE'],
        sites: [
          { name: 'donateNYC', does: [], href: 'https://www.nyc.gov/assets/donate/site/home', note: 'TO WRITE' },
          { name: 'Big Reuse (Gowanus)', does: [], address: 'TO WRITE', hours: 'TO WRITE', href: 'https://bigreuse.org', note: 'TO WRITE' },
          { name: 'DSNY: How to get rid of…', does: [], href: 'https://www.nyc.gov/site/dsny/collection/get-rid-of.page', note: 'TO WRITE' },
        ],
      },
    ],
  },
}
