import { Check, Users, Lock, PackageSearch } from 'lucide-react';
import { useT } from '../locale.js';

const ICONS = [Users, Lock, PackageSearch];

export default function Product() {
  const { product } = useT();
  return (
    <section className="sect" id="product">
      <p className="sect__tag rv">{product.tag}</p>
      <p className="sect__lead rv">{product.lead}</p>
      <div className="cols cols--3">
        {product.cards.map((c, i) => {
          const Icon = ICONS[i] ?? Check;
          return (
            <article className="prod rv" key={c.name}>
              <div className="prod__head">
                <Icon size={24} aria-hidden="true" style={{ color: 'var(--brand)' }} />
                <div>
                  <h3 className="prod__name">{c.name}</h3>
                </div>
              </div>
              <p className="prod__desc">{c.desc}</p>
              <ul className="prod__points">
                {c.points.map((p) => (
                  <li key={p}><Check aria-hidden="true" />{p}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
