'use client';

import { useContext } from 'react';
import { ArrowRight, ChevronDown, Code2, GitCompareArrows } from 'lucide-react';
import { useLocale } from '../locale.js';
import { reviewCopy } from '../review-demo.js';
import { ReviewCtx } from '../prism/review-context.js';

export default function ReviewDemo() {
  const locale = useLocale();
  const copy = reviewCopy[locale];
  const { state, dispatch } = useContext(ReviewCtx);
  const candidate = copy.cases.find((c) => c.id === state.caseId);
  const review = candidate.states[state.stage];
  return (
    <section className="review-demo" aria-labelledby="review-demo-title" data-review-demo>
      <header className="review-demo__head">
        <span className="review-demo__label"><GitCompareArrows size={15} aria-hidden="true" />{copy.label}</span>
        <h3 id="review-demo-title">{copy.title}</h3>
      </header>
      <div className="review-demo__controls">
        <div className="case-picker" role="group" aria-label={copy.casesLabel}>
          {copy.cases.map((item) => (
            <button key={item.id} type="button" aria-pressed={state.caseId === item.id}
              onClick={() => dispatch({ type: 'case', id: item.id })}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="review-demo__code" aria-label={copy.codeLabel}>
        <div className="review-demo__file"><Code2 size={14} aria-hidden="true" /><span>{candidate.file}</span><span>TypeScript</span></div>
        <pre tabIndex={0}><code>{candidate.code.map((line, index) => (
          <span className={`code-line${candidate.highlight.includes(index + 1) ? ' code-line--focus' : ''}`} key={`${candidate.id}-${index}`}>
            <span className="code-line__number" aria-hidden="true">{index + 1}</span><span>{line}</span>
          </span>
        ))}</code></pre>
      </div>
      <div className="review-demo__controls">
        <div className="review-stages" role="group" aria-label={copy.stagesLabel}>
          {copy.stages.map((label, index) => (
            <button key={label} type="button" aria-pressed={state.stage === index}
              onClick={() => dispatch({ type: 'stage', stage: index })}>
              <span aria-hidden="true">0{index + 1}</span>{label}
            </button>
          ))}
        </div>
      </div>
      <div className="review-verdict" role="status" aria-live="polite" aria-atomic="true">
        <p className="review-verdict__status">{review.status}</p>
        <h3>{review.title}</h3>
        <p>{review.body}</p>
      </div>
      <div className="review-demo__controls review-demo__actions">
        <button className="reason-toggle" type="button" aria-expanded={state.expanded} aria-controls="review-reason"
          onClick={() => dispatch({ type: 'reason' })}>
          {state.expanded ? copy.hide : copy.show}<ChevronDown size={15} aria-hidden="true" />
        </button>
        <button className="review-next" type="button" onClick={() => dispatch({ type: 'next' })}>
          {state.stage === 2 ? copy.reset : copy.next}<ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
      <div id="review-reason" className="review-reason" hidden={!state.expanded}>{review.reason}</div>
      <details className="review-demo__fallback">
        <summary>{copy.fallback}</summary>
        {copy.cases.map((item) => (
          <article key={item.id}><h3>{item.label}</h3><pre><code>{item.code.join('\n')}</code></pre>
            {item.states.map((stage, i) => <div key={stage.status}><h4>{copy.stages[i]}: {stage.status}</h4><p>{stage.body} {stage.reason}</p></div>)}
          </article>
        ))}
      </details>
      <p className="review-demo__disclaimer">{copy.disclaimer}</p>
    </section>
  );
}
