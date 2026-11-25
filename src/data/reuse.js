// Reuse, repair and "use it up" ideas, shown in the pop-up on the Disposal page.
//
// HOW THIS FILE IS ORGANIZED
// --------------------------
// `TIPS` is an object: a set of  key: value  pairs inside { curly braces }.
//   - Each KEY is an item's id from items.js (the first thing in each row there,
//     e.g. 'clothes', 'furniture', 'glass').
//   - Each VALUE is an array (a list in [square brackets]) of tips for that item.
//
// Each tip is itself a small object with two fields:
//   kind: which badge to show. Must be one of the keys in KINDS below.
//   text: the tip itself, in quotes. Keep it to one or two short sentences.
//
// TO ADD TIPS FOR AN ITEM
//   1. Find the item's id in items.js.
//   2. Add a line here:   itemid: [ { kind: 'reuse', text: '...' }, ... ],
//   3. Save. The pop-up for that item now shows your tips.
// Items with no entry here simply don't show the tips section.
//
// SYNTAX REMINDERS
//   - Text goes in quotes: 'like this'. If your text contains an apostrophe,
//     use the curly one (’) as in "don’t", or wrap the text in "double quotes".
//   - Put a comma after every tip and after every item's closing ].
//   - Lines starting with // are comments. JavaScript ignores them, so use them for notes.

// The kinds of tips, with the label shown on each badge.
export const KINDS = {
  reuse:  'Reuse',
  repair: 'Repair',
  diy:    'Make something',
  avoid:  'Use less',
}

export const TIPS = {
  clothes:   [ { kind: 'reuse', text: 'TO WRITE' } ],
  furniture: [ { kind: 'reuse', text: 'TO WRITE' } ],
  smallapp:  [ { kind: 'repair', text: 'TO WRITE' } ],
  glass:     [ { kind: 'reuse', text: 'TO WRITE' } ],
  food:      [ { kind: 'avoid', text: 'TO WRITE' } ],
}
