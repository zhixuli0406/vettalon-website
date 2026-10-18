import { useT } from '../locale.js';
import SectionHead from './SectionHead.jsx';

export default function Benchmarks() {
  const { benchmarks } = useT();
  return (
    <section className="sect benchmarks" id="benchmarks">
      <SectionHead tag={benchmarks.tag} lead={benchmarks.lead} />
      <div className="benchmark-grid">
        {benchmarks.items.map((item) => <article className="stat rv" key={item.k}><p className="stat__v">{item.v}</p><h3 className="stat__k">{item.k}</h3><p className="stat__d">{item.d}</p></article>)}
      </div>
      <p className="section-note benchmark-limit rv">{benchmarks.note}</p>
    </section>
  );
}
