import { Check } from 'lucide-react';
import { useT, useLocale } from '../locale.js';

export default function Product() {
  const { product } = useT();
  const en = useLocale() === 'en';
  return <section className="sect capabilities" id="product" aria-labelledby="product-title">
    <header className="sect__head"><p className="eyebrow">{en ? '03 / Fit it to your workflow' : '03 / 放進你的工作流程'}</p><h2 className="sect__title" id="product-title">{en ? 'Your code. Your boundaries.' : '程式碼的去向，\n由你決定。'}</h2><p className="sect__lead">{product.lead}</p></header>
    <div className="capability-list">{product.cards.map((card, index) => <article className="capability-row" key={card.name}><span className="capability-row__index" aria-hidden="true">0{index + 1}</span><div><h3>{card.name}</h3><p>{card.desc}</p></div><ul className="checks">{card.points.map((point) => <li key={point}><Check aria-hidden="true" />{point}</li>)}</ul></article>)}</div>
  </section>;
}
