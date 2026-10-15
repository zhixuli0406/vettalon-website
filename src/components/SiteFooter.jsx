import { useT, useLocale } from '../locale.js';
import { pagePath } from '../i18n.js';
import { VettalonMark, CompanyMark } from './Marks.jsx';

const COMPANY_URL = 'https://www.dudustudio.monster/';

export default function SiteFooter() {
  const { footer } = useT();
  const locale = useLocale();
  return (
    <footer className="footer">
      <div className="footer__in">
        <div className="footer__top">
          <div className="footer__brand">
            <a className="footer__word" href={pagePath(locale)}>
              <VettalonMark size={32} />
              <span>Vettalon</span>
            </a>
            <p>{footer.tagline}</p>
          </div>
          <div className="footer__groups">
            {footer.groups.map((g) => (
              <div className={`footer__grp${g.links.every((l) => l.href.startsWith('mailto:')) ? ' footer__grp--wide' : ''}`} key={g.title}>
                <h2>{g.title}</h2>
                {g.links.map((l) => {
                  const external = l.href.startsWith('http');
                  return (
                    <a key={l.t} href={l.href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
                      {l.t}
                    </a>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="footer__legal">
          <a className="footer__co" href={COMPANY_URL} target="_blank" rel="noopener noreferrer">
            <CompanyMark size={32} />
            <span>{footer.company}</span>
          </a>
          <span className="footer__copy">© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
