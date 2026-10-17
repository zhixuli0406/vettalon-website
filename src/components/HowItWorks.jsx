import { useT } from '../locale.js';
import { useLocale } from '../locale.js';

export default function HowItWorks() {
  const { how } = useT();
  const en = useLocale() === 'en';
  return (
    <section className="sect workflow" id="how">
      <div className="workflow__intro rv"><h2 className="sect__title">{how.tag}</h2><p className="sect__lead">{how.lead}</p></div>
      <details className="pipeline-details"><summary>{en ? 'Inspect the five-stage scan pipeline' : '展開五個掃描階段'}</summary><ol className="steps">
        {how.steps.map((step) => <li key={step.n} className="rv"><span className="steps__n mono">{step.n}</span><div><h3>{step.t}</h3><p>{step.d}</p></div></li>)}
      </ol></details>
    </section>
  );
}
