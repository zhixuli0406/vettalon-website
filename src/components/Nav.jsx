import { useEffect, useRef, useState } from 'react';
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
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { setOpen(false); toggleRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Section anchors live on the landing page; prefix them so they also work
  // from legal pages. On the landing page this is a same-document jump.
  const home = pagePath(locale);
  const links = locale === 'en' ? [{ href: '#review', label: 'How review works' }, { href: '#report', label: 'Evidence' }, { href: '#product', label: 'Capabilities' }, { href: '#editions', label: 'Editions' }] : [{ href: '#review', label: '覆核流程' }, { href: '#report', label: '真實輸出' }, { href: '#product', label: '能力與資料' }, { href: '#editions', label: '版本價格' }];
  const close = () => setOpen(false);
  return (
    <header className={`nav${open ? ' is-open' : ''}`}>
      <div className="nav__in">
        <a className="nav__brand" href={home}>
          <VettalonMark size={30} />
          <span className="nav__word">Vettalon</span>
        </a>
        <button
          ref={toggleRef}
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
          {links.map((l) => (
            <a key={l.href} href={home + l.href} onClick={close}>{l.label}</a>
          ))}
          <a className="nav__lang" href={otherLocaleHref(locale, page)} hrefLang={locale === 'en' ? 'zh-Hant' : 'en'}>
            {locale === 'en' ? '中文' : 'EN'}
          </a>
          <a className="btn btn--primary btn--sm nav__cta" href={home + '#editions'} onClick={close}>
            {locale === 'en' ? 'Get started' : '開始使用'} <ArrowUpRight size={14} aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  );
}
