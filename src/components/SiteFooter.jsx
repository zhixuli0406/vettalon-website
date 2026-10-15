import { useT } from '../locale.js';

export default function SiteFooter() {
  const { footer } = useT();
  return (
    <footer className="footer">
      <div className="footer__in">
        <div className="footer__co">
          <b>Vettalon</b>
          <p>{footer.tagline}</p>
        </div>
        {footer.groups.map((g) => (
          <div className="footer__grp" key={g.title}>
            <span>{g.title}</span>
            {g.links.map((l) => (
              <a key={l.t} href={l.href} target={l.href.startsWith('http') ? '_blank' : undefined} rel={l.href.startsWith('http') ? 'noopener noreferrer' : undefined}>
                {l.t}
              </a>
            ))}
          </div>
        ))}
        <p className="footer__legal">
          © {new Date().getFullYear()} {footer.copyright}
        </p>
      </div>
    </footer>
  );
}
