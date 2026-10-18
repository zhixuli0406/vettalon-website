import { ArrowUpRight } from 'lucide-react';
import { useLocale, useT } from '../locale.js';
import { countLabel, pagePath } from '../i18n.js';
import { cases } from '../evidence/cases.js';
import { homepageEvidence } from '../evidence/homepage.js';
import SectionHead from './SectionHead.jsx';

export default function Benchmarks() {
  const { benchmarks } = useT();
  const locale = useLocale();
  const { counts, items } = homepageEvidence(cases, benchmarks.items);
  return (
    <section className="sect benchmarks" id="benchmarks">
      <SectionHead tag={benchmarks.tag} lead={benchmarks.lead} />
      <p className="section-note rv" data-public-case-count={counts.public}>
        {counts.public} {countLabel(benchmarks.collection.public, counts.public)} · {counts.historical} {countLabel(benchmarks.collection.historical, counts.historical)} · {counts.discovery} {countLabel(benchmarks.collection.discovery, counts.discovery)}
        {counts.reported > 0 ? <> · {counts.reported} {countLabel(benchmarks.collection.reported, counts.reported)}</> : null}
        <span aria-hidden="true"> · </span><span className="sr-only">. </span>{benchmarks.collection.boundary}
      </p>
      <div className="benchmark-grid">
        {items.map((item) => <article className="stat rv" data-case-type={item.type} key={item.id}><p className="stat__v">{item.v}</p><h3 className="stat__k">{item.k}</h3><p className="stat__d">{item.d}</p><a className="link stat__link" href={pagePath(locale, `evidence/${item.id}`)}>{item.link}<ArrowUpRight size={16} aria-hidden="true" /></a></article>)}
      </div>
      <p className="section-note benchmark-limit rv">{benchmarks.note} <a href={pagePath(locale, 'evidence')}>{locale === 'en' ? 'Explore all public cases' : '查看全部公開案例'}</a></p>
    </section>
  );
}
