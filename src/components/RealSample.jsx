import { useT, useLocale } from '../locale.js';

// Real sample output, copied verbatim from the public README
// (github.com/zhixuli0406/vettalon, "Sample output"). Update it from there,
// never by hand-writing results.
const SAMPLE_CMD =
  'vettalon scan fixtures/demo-app --profile deep --poc --finders claude --verifiers codex';
const SAMPLE_OUT = [
  { t: '程式碼安全審計（vettalon）' },
  { t: '  ...', dim: true },
  { t: 'AI 深度審計／對抗式覆核／PoC（deep profile）：' },
  { t: '  AI 候選：2　已證偽：0（其中前置檢查證偽 0）　待人工覆核：2　PoC 已執行：2' },
  { t: '  模組覆蓋：共 4　已審 4（無候選 2、有候選 2）　延後 0　失敗 0' },
  { t: '  覆核獨立性：全部跨家族覆核（找洞：claude；覆核：codex）' },
  { t: '結論：未達 --fail-on 門檻（high），視為通過。', hi: true },
];

export default function RealSample({ open = false }) {
  const { hero } = useT();
  const locale = useLocale();
  return (
    <details className="real-sample" open={open}>
      <summary>{locale === 'en' ? 'Read a real CLI output sample' : '看真實的 CLI 範例輸出'}</summary>
      <figure className="term">
        <pre className="term__body" tabIndex={0}><code>
          <span className="term__line"><span className="term__prompt">$ </span>{SAMPLE_CMD}</span>
          {SAMPLE_OUT.map((l, i) => <span key={i} className={`term__line${l.dim ? ' is-dim' : ''}${l.hi ? ' is-hi' : ''}`}>{l.t}</span>)}
        </code></pre>
        <figcaption>{hero.terminalCaption}</figcaption>
      </figure>
    </details>
  );
}
