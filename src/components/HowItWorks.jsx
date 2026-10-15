import { useT } from '../locale.js';

export default function HowItWorks() {
  const { how } = useT();
  return (
    <section className="sect sect--compact" id="how">
      <p className="sect__tag rv">{how.tag}</p>
      <p className="sect__lead rv">{how.lead}</p>
      <ol className="steps rv">
        {how.steps.map((s) => (
          <li key={s.n}>
            <span className="mono">{s.n}</span>
            <div>
              <strong>{s.t}</strong>
              <p>{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
