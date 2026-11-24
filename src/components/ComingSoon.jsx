// Placeholder for tabs we haven't built yet. Shows what's coming.
export default function ComingSoon({ title, items, note }) {
  return (
    <section className="soon">
      <h1>{title}</h1>
      {note && <p className="note">{note}</p>}
      <p className="muted">Coming in a later step:</p>
      <ul>{items.map(i => <li key={i}>{i}</li>)}</ul>
    </section>
  )
}