import { Check } from 'lucide-react';
import { useT } from '../locale.js';

export default function Editions() {
  const { editions } = useT();
  return (
    <section className="sect" id="editions">
      <p className="sect__tag rv">{editions.tag}</p>
      <p className="sect__lead rv">{editions.lead}</p>
      <div className="cols cols--3">
        {editions.cards.map((c) => (
          <article className="prod plan rv" key={c.name}>
            <div className="prod__head">
              <h3 className="prod__name">{c.name}</h3>
              <span className="prod__oss">{c.type}</span>
            </div>
            <p className="plan__price">{c.price}</p>
            <p className="plan__note">{c.priceNote}</p>
            <p className="prod__desc">{c.desc}</p>
            <ul className="prod__points">
              {c.points.map((p) => (
                <li key={p}><Check aria-hidden="true" />{p}</li>
              ))}
            </ul>
            <div className="prod__cta">
              <a
                className="btn btn--brand"
                href={c.href}
                target={c.href.startsWith('http') ? '_blank' : undefined}
                rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {c.cta}
              </a>
            </div>
          </article>
        ))}
      </div>
      <p className="plan__terms rv">{editions.note}</p>
    </section>
  );
}
