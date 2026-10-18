import { useT } from '../locale.js';

export default function Faq() {
  const { faq } = useT();
  return (
    <section className="sect questions" id="faq">
      <h2 className="sect__title rv">{faq.tag}</h2>
      <div className="faq rv">{faq.items.map((item) => <details key={item.q}><summary>{item.q}</summary><p>{item.a}</p></details>)}</div>
    </section>
  );
}
