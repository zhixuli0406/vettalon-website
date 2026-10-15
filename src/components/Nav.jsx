import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useT, useLocale } from '../locale.js';

// Preserve the current in-page hash when switching language so the reader
// stays on the same section.
function otherLocaleHref(locale) {
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  return locale === 'en' ? '/' + hash : '/en/' + hash;
}

export default function Nav() {
  const t = useT();
  const locale = useLocale();
  return (
    <header className="nav">
      <div className="nav__in">
        <a className="nav__mark" href={locale === 'en' ? '/en/' : '/'}>
          <ShieldCheck size={22} aria-hidden="true" style={{ color: 'var(--brand)' }} />
          Vettalon
        </a>
        <nav className="nav__links" aria-label={locale === 'en' ? 'Main' : '主選單'}>
          {t.nav.links.map((l) => (
            <a key={l.href} href={l.href}>{l.label}</a>
          ))}
          <a className="nav__lang" href={otherLocaleHref(locale)} hrefLang={locale === 'en' ? 'zh-Hant' : 'en'}>
            {locale === 'en' ? '中文' : 'EN'}
          </a>
          <a className="nav__prod" href="#editions">
            {t.nav.cta} <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  );
}
