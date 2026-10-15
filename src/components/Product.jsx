import { Check } from 'lucide-react';
import { useT } from '../locale.js';
import SectionHead from './SectionHead.jsx';

export default function Product() {
  const { product } = useT();
  return (
    <section className="sect" id="product">
      <SectionHead tag={product.tag} lead={product.lead} />
      <div className="grid grid--3">
        {product.cards.map((c) => (
          <article className="card card--bar rv" key={c.name}>
            <h3 className="card__title">{c.name}</h3>
            <p className="card__desc">{c.desc}</p>
            <ul className="checks">
              {c.points.map((p) => (
                <li key={p}><Check aria-hidden="true" />{p}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
