import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { useT, useLocale, usePage } from '../locale.js';
import { pagePath } from '../i18n.js';

// Switch language on the same page, preserving the in-page hash so the reader
// stays on the same section.
function otherLocaleHref(locale, page) {
  const hash = typeof window !== 'undefined' ? window.location.hash : '';
  return pagePath(locale === 'en' ? 'zh' : 'en', page) + hash;
}

export default function Nav() {
  const t = useT();
  const locale = useLocale();
  const page = usePage();
  // Section anchors live on the landing page; prefix them so they also work
  // from legal pages. On the landing page this is a same-document jump.
  const home = pagePath(locale);
  return (
    <header className="nav">
      <div className="nav__in">
        <a className="nav__mark" href={home}>
          <ShieldCheck size={22} aria-hidden="true" style={{ color: 'var(--brand)' }} />
          Vettalon
        </a>
        <nav className="nav__links" aria-label={locale === 'en' ? 'Main' : '主選單'}>
          {t.nav.links.map((l) => (
            <a key={l.href} href={home + l.href}>{l.label}</a>
          ))}
          <a className="nav__lang" href={otherLocaleHref(locale, page)} hrefLang={locale === 'en' ? 'zh-Hant' : 'en'}>
            {locale === 'en' ? '中文' : 'EN'}
          </a>
          <a className="nav__prod" href={home + '#editions'}>
            {t.nav.cta} <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  );
}
