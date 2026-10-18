import { ArrowUpRight } from 'lucide-react';
import { useLocale, useT } from '../locale.js';
import { pagePath } from '../i18n.js';
import SectionHead from './SectionHead.jsx';

export default function Benchmarks() {
  const { benchmarks } = useT();
  const locale = useLocale();
  return (
    <section className="sect benchmarks" id="benchmarks">
      <SectionHead tag={benchmarks.tag} lead={benchmarks.lead} />
      <div className="benchmark-grid">
        {benchmarks.items.map((item) => <article className="stat rv" key={item.k}><p className="stat__v">{item.v}</p><h3 className="stat__k">{item.k}</h3><p className="stat__d">{item.d}</p><a className="link stat__link" href={pagePath(locale, `evidence/${item.id}`)}>{item.link}<ArrowUpRight size={16} aria-hidden="true" /></a></article>)}
      </div>
      <p className="section-note benchmark-limit rv">{benchmarks.note} <a href={pagePath(locale, 'evidence')}>{locale === 'en' ? 'Explore all public cases' : '查看全部公開案例'}</a></p>
    </section>
  );
}
