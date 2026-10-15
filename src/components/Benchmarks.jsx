import { useT } from '../locale.js';

export default function Benchmarks() {
  const { benchmarks } = useT();
  return (
    <section className="sect" id="benchmarks">
      <p className="sect__tag rv">{benchmarks.tag}</p>
      <p className="sect__lead rv">{benchmarks.lead}</p>
      <div className="cols cols--3">
        {benchmarks.items.map((it) => (
          <div className="stat rv" key={it.k}>
            <div className="stat__v mono">{it.v}</div>
            <div className="stat__k">{it.k}</div>
            <p className="stat__d">{it.d}</p>
          </div>
        ))}
      </div>
      <p className="section-note rv">{benchmarks.note}</p>
    </section>
  );
}
