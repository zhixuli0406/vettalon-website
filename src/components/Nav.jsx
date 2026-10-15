import { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useT, useLocale, usePage } from '../locale.js';
import { pagePath } from '../i18n.js';
import { VettalonMark } from './Marks.jsx';

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
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // Bottom hairline appears once the page has scrolled (spec §4 nav).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Section anchors live on the landing page; prefix them so they also work
  // from legal pages. On the landing page this is a same-document jump.
  const home = pagePath(locale);
  const close = () => setOpen(false);
  return (
    <header className={`nav${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}`}>
      <div className="nav__in">
        <a className="nav__brand" href={home}>
          <VettalonMark size={30} />
          <span className="nav__word">Vettalon</span>
        </a>
        <button
          type="button"
          className="nav__toggle"
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          <span className="sr-only">{t.nav.menu}</span>
        </button>
        <nav id="site-menu" className="nav__links" aria-label={locale === 'en' ? 'Main' : '主選單'}>
          {t.nav.links.map((l) => (
            <a key={l.href} href={home + l.href} onClick={close}>{l.label}</a>
          ))}
          <a className="nav__lang" href={otherLocaleHref(locale, page)} hrefLang={locale === 'en' ? 'zh-Hant' : 'en'}>
            {locale === 'en' ? '中文' : 'EN'}
          </a>
          <a className="btn btn--primary btn--sm nav__cta" href={home + '#editions'} onClick={close}>
            {t.nav.cta} <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  );
}
