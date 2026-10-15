import { useT } from '../locale.js';
import { GITHUB } from '../i18n.js';

export default function Hero() {
  const { hero } = useT();
  return (
    <section className="hero">
      <div className="hero__in">
        <p className="hero__kicker rv">{hero.kicker}</p>
        <h1 className="rv">
          {hero.h1a}
          <em>{hero.h1em}</em>
          {hero.h1b}
        </h1>
        <p className="hero__lead rv">{hero.lead}</p>
        <div className="hero__cta rv">
          <a className="btn btn--brand" href={GITHUB} target="_blank" rel="noopener noreferrer">{hero.ctaPrimary}</a>
          <a className="btn btn--ghost" href="#how">{hero.ctaSecondary}</a>
          <a className="btn btn--ghost" href="#editions">{hero.ctaTertiary}</a>
        </div>
        <p className="hero__note rv">{hero.note}</p>
      </div>
    </section>
  );
}
