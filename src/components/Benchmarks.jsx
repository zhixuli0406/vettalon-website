import { useT } from '../locale.js';
import SectionHead from './SectionHead.jsx';

export default function Benchmarks() {
  const { benchmarks } = useT();
  return (
    <section className="sect" id="benchmarks">
      <SectionHead tag={benchmarks.tag} lead={benchmarks.lead} />
      <div className="grid grid--3">
        {benchmarks.items.map((it) => (
          <div className="card card--bar stat rv" key={it.k}>
            <div className="stat__v">{it.v}</div>
            <div className="stat__k">{it.k}</div>
            <p className="stat__d">{it.d}</p>
          </div>
        ))}
      </div>
      <p className="section-note rv">{benchmarks.note}</p>
    </section>
  );
}
