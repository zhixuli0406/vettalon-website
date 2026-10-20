import { useEffect, useState } from 'react';
import { Check, ArrowUpRight } from 'lucide-react';
import { useT, useLocale } from '../locale.js';
import { GITHUB } from '../i18n.js';
import { formatSupportEnd, supportEndFor } from '../support.js';

// Today's support end month. Computed after hydration so the prerendered
// HTML (built on another day) never states a stale date.
function SupportToday({ support, locale }) {
  const [end, setEnd] = useState('');
  useEffect(() => { setEnd(formatSupportEnd(supportEndFor(new Date()), locale)); }, [locale]);
  return <p>{support.rule}{end && <> <strong>{support.today(end)}</strong></>}</p>;
}

export default function Editions() {
  const { editions } = useT();
  const locale = useLocale();
  const en = locale === 'en';
  const uses = en ? ['For CLI and CI', 'For an individual reviewer', 'For a review team'] : ['在 CLI／CI 開始', '一個人稽核與交付', '團隊共同使用'];
  return <section className="sect editions" id="editions" aria-labelledby="editions-title">
    <header className="sect__head"><p className="eyebrow">{en ? '04 / Choose your next step' : '04 / 選擇下一步'}</p><h2 className="sect__title" id="editions-title">{en ? 'Start with what you need.' : '從你需要的版本開始。'}</h2><p className="sect__lead">{editions.lead}</p></header>
    <div className="edition-list">{editions.cards.map((c, i) => <article className="edition" key={c.name}>
      <div className="edition__identity"><p className="eyebrow">{uses[i]}</p><h3>{c.name}</h3><p className="edition__type">{c.type}</p><p className="edition__price">{c.price}</p><p className="edition__terms">{c.priceNote}</p></div>
      <div className="edition__scope"><p>{c.desc}</p><ul className="checks">{c.points.map((point) => <li key={point}><Check aria-hidden="true" />{point}</li>)}</ul></div>
      <a className={`btn ${c.href === GITHUB ? 'btn--secondary' : 'btn--primary'}`} href={c.href} target="_blank" rel="noopener noreferrer">{c.cta}<ArrowUpRight size={17} aria-hidden="true" /></a>
    </article>)}</div>
    <div className="edition-footnotes"><p>{editions.note}</p><SupportToday support={editions.support} locale={locale} /><a className="link" href={editions.support.link.href}>{editions.support.link.label}<ArrowUpRight size={16} aria-hidden="true" /></a><a className="link" href={editions.download.href}>{editions.download.label}<ArrowUpRight size={16} aria-hidden="true" /></a></div>
  </section>;
}
