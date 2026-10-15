import { Check } from 'lucide-react';
import { useT } from '../locale.js';
import { GITHUB, CONTACT } from '../i18n.js';

export default function Editions() {
  const { editions } = useT();
  const hrefs = [GITHUB, CONTACT];
  return (
    <section className="sect" id="editions">
      <p className="sect__tag rv">{editions.tag}</p>
      <p className="sect__lead rv">{editions.lead}</p>
      <div className="cols cols--2">
        {editions.cards.map((c, i) => (
          <article className="prod rv" key={c.name}>
            <div className="prod__head">
              <div>
                <h3 className="prod__name">{c.name}</h3>
              </div>
              <span className="prod__oss">{c.type}</span>
            </div>
            <p className="prod__desc">{c.desc}</p>
            <ul className="prod__points">
              {c.points.map((p) => (
                <li key={p}><Check aria-hidden="true" />{p}</li>
              ))}
            </ul>
            <div className="prod__cta">
              <a className="btn btn--brand" href={hrefs[i]} target="_blank" rel="noopener noreferrer">{c.cta}</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
