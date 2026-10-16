import { Check } from 'lucide-react';
import { useT } from '../locale.js';
import { GITHUB } from '../i18n.js';
import SectionHead from './SectionHead.jsx';

export default function Editions() {
  const { editions } = useT();
  return (
    <section className="sect" id="editions">
      <SectionHead tag={editions.tag} lead={editions.lead} />
      <div className="grid grid--3 plans">
        {editions.cards.map((c) => {
          const external = c.href.startsWith('http');
          // Paid plans get the primary button; the free core links out to GitHub.
          const primary = c.href !== GITHUB;
          return (
            <article className={`card plan rv${primary ? ' card--bar' : ''}`} key={c.name}>
              <span className="plan__type">{c.type}</span>
              <h3 className="card__title">{c.name}</h3>
              <p className="plan__price">{c.price}</p>
              <p className="plan__note">{c.priceNote}</p>
              <p className="card__desc">{c.desc}</p>
              <ul className="checks">
                {c.points.map((p) => (
                  <li key={p}><Check aria-hidden="true" />{p}</li>
                ))}
              </ul>
              <div className="plan__cta">
                <a
                  className={`btn ${primary ? 'btn--primary' : 'btn--secondary'}`}
                  href={c.href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                >
                  {c.cta}
                </a>
              </div>
            </article>
          );
        })}
      </div>
      <p className="section-note rv">{editions.note}</p>
      <p className="section-note rv">
        <a href={editions.download.href} target="_blank" rel="noopener noreferrer">
          {editions.download.label}
        </a>
      </p>
    </section>
  );
}
