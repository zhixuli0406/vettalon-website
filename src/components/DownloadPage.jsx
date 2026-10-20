import { useEffect, useState } from 'react';
import { Download, AlertTriangle, Check } from 'lucide-react';
import { useLocale } from '../locale.js';
import { downloadCopy } from '../download-copy.js';
import { DESKTOP_VERSION, FILES, formatSize, probePlatform } from '../downloads.js';

const ORDER = ['mac', 'windows', 'linux'];

function FileButton({ fileKey, label, primary = false }) {
  const f = FILES[fileKey];
  return (
    <a className={`btn ${primary ? 'btn--primary' : 'btn--secondary'} download__btn`} href={f.url} download>
      <Download size={18} aria-hidden="true" />{label}
    </a>
  );
}

// The detected platform's call to action. Before detection (and in the
// prerendered HTML) it only points to the full list below.
function Suggestion({ env, t }) {
  if (!env) return <p className="download__hint" aria-live="polite">{t.pick}</p>;
  const size = (key) => formatSize(FILES[key].bytes);
  if (env.os === 'mac' && env.arch === 'x86') {
    return (
      <div className="download__alert" role="alert">
        <AlertTriangle size={22} aria-hidden="true" />
        <div>
          <h2>{t.intel.title}</h2>
          <p>{t.intel.body}</p>
          <p>{t.intel.check}</p>
          <p><a className="link" href={FILES.mac.url} download>{t.intel.wrong}</a></p>
        </div>
      </div>
    );
  }
  if (env.os === 'mac') {
    return (
      <div className="download__suggest">
        <p className="eyebrow">{t.detected.mac}</p>
        <FileButton fileKey="mac" label={t.downloadFor.mac} primary />
        <p className="download__meta">{t.platforms.mac.req.slice(0, 2).join(' · ')} · {size('mac')}</p>
        {!env.arch && <p className="download__hint">{t.macUnknownArch}</p>}
      </div>
    );
  }
  if (env.os === 'windows') {
    return (
      <div className="download__suggest">
        <p className="eyebrow">{t.detected.windows}</p>
        <FileButton fileKey="windows" label={t.downloadFor.windows} primary />
        <p className="download__meta">{t.platforms.windows.req[0]} · {size('windows')}</p>
      </div>
    );
  }
  if (env.os === 'linux') {
    return (
      <div className="download__suggest">
        <p className="eyebrow">{t.detected.linux}</p>
        <div className="download__pair">
          <FileButton fileKey="deb" label={t.downloadFor.deb} primary />
          <FileButton fileKey="appimage" label={t.downloadFor.appimage} />
        </div>
        <p className="download__meta">{t.platforms.linux.req[0]} · .deb {size('deb')} · AppImage {size('appimage')}</p>
      </div>
    );
  }
  return <p className="download__hint" aria-live="polite">{env.os === 'mobile' ? t.mobile : t.other}</p>;
}

export default function DownloadPage() {
  const locale = useLocale();
  const t = downloadCopy[locale] ?? downloadCopy.zh;
  const [env, setEnv] = useState(null);

  useEffect(() => {
    let live = true;
    probePlatform().then((found) => { if (live) setEnv(found); }, () => { if (live) setEnv({ os: 'other', arch: '' }); });
    return () => { live = false; };
  }, []);

  // An Intel Mac gets the warning, not a highlighted macOS download.
  const current = env && ORDER.includes(env.os) && env.arch !== 'x86' ? env.os : '';
  return (
    <article className="download">
      <header className="download__head">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="download__title">{t.title}</h1>
        <p className="download__lead">{t.lead} <span className="download__version mono">{t.version(DESKTOP_VERSION)}</span></p>
        <Suggestion env={env} t={t} />
      </header>

      <section className="download__platforms" id="platforms" aria-labelledby="platforms-title">
        <h2 id="platforms-title" className="download__h2">{t.allPlatforms}</h2>
        <div className="download__grid">
          {ORDER.map((os) => {
            const p = t.platforms[os];
            return (
              <section className={`download__card${current === os ? ' is-current' : ''}`} key={os} aria-labelledby={`dl-${os}`}>
                <div className="download__card-head">
                  <h3 id={`dl-${os}`}>{p.name}</h3>
                  {os === 'mac' && <span className="download__badge"><AlertTriangle size={14} aria-hidden="true" />{t.noIntel}</span>}
                </div>
                <ul className="checks">
                  {p.req.map((r) => <li key={r}><Check aria-hidden="true" />{r}</li>)}
                </ul>
                <div className="download__files">
                  {p.files.map(({ key, label }) => (
                    <div className="download__file" key={key}>
                      <FileButton fileKey={key} label={label} primary={current === os} />
                      <p className="download__meta mono">{FILES[key].name} · {formatSize(FILES[key].bytes)}</p>
                      <details className="download__sha">
                        <summary>{t.sha}</summary>
                        <code>{FILES[key].sha256}</code>
                      </details>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section className="download__info" aria-labelledby="install-title">
        <div>
          <h2 id="install-title" className="download__h2">{t.install.title}</h2>
          <ol className="download__steps">
            {ORDER.map((os) => <li key={os}><strong>{t.platforms[os].name}</strong>{t.install.steps[os]}</li>)}
          </ol>
          <p>{t.install.activate}</p>
          <p>{t.install.update}</p>
        </div>
        <div>
          <h2 className="download__h2">{t.notes.title}</h2>
          <ul className="download__notes">
            {t.notes.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <h2 className="download__h2">{t.cli.title}</h2>
          <p>{t.cli.body}</p>
          <pre className="download__cmd"><code>{t.cli.cmd}</code></pre>
        </div>
      </section>
    </article>
  );
}
