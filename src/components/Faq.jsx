import { useT } from '../locale.js';

export default function Faq() {
  const { faq } = useT();
  return (
    <section className="sect sect--compact" id="faq">
      <p className="sect__tag rv">{faq.tag}</p>
      <div className="faq rv">
        {faq.items.map((it) => (
          <details key={it.q}>
            <summary>{it.q}</summary>
            <p>{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
