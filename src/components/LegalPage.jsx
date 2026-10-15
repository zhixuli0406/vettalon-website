import { useLocale } from '../locale.js';
import { legal, EFFECTIVE_DATE } from '../legal.js';
import { pagePath } from '../i18n.js';

export default function LegalPage({ page }) {
  const locale = useLocale();
  const L = legal[locale] ?? legal.zh;
  const doc = L[page];
  return (
    <article className="sect legal">
      <a className="legal__back" href={pagePath(locale)}>← {L.back}</a>
      <h1 className="legal__title">{doc.title}</h1>
      <p className="legal__date">{L.effective}：{EFFECTIVE_DATE}</p>
      {doc.sections.map((s) => (
        <section className="legal__sect" key={s.h}>
          <h2>{s.h}</h2>
          {s.p.map((para) => <p key={para}>{para}</p>)}
          {s.link && <p><a href={pagePath(locale, s.link.page)}>{s.link.label}</a></p>}
        </section>
      ))}
    </article>
  );
}
