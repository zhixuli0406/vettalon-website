import { useT } from '../locale.js';
import SectionHead from './SectionHead.jsx';

export default function HowItWorks() {
  const { how } = useT();
  return (
    <section className="sect" id="how">
      <SectionHead tag={how.tag} lead={how.lead} />
      <ol className="steps rv">
        {how.steps.map((s) => (
          <li key={s.n}>
            <span className="steps__n mono">{s.n}</span>
            <strong className="steps__t">{s.t}</strong>
            <p className="steps__d">{s.d}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
