import { useT } from '../locale.js';
import SectionHead from './SectionHead.jsx';

export default function Faq() {
  const { faq } = useT();
  return (
    <section className="sect" id="faq">
      <SectionHead tag={faq.tag} />
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
