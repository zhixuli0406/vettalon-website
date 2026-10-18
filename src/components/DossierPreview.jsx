import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../locale.js';
import { createDossierSession, previewStateFor } from '../evidence/load-dossier.js';

const labels = {
  zh: { view:'查看原文節錄', loading:'正在核對節錄…', retry:'重新核對原文節錄', error:'無法核對原文節錄。未顯示附件內容；可重試或自行開啟 JSON 原檔。', matched:'附件位元組與本頁記錄的雜湊及資料欄位一致。', boundary:'這項核對不證明歷史執行、漏洞真實性、人工定案或簽章。原始報告不公開。', finding:'原 finding 文字', review:'覆核原文與判定', omitted:'沒有有效覆核原文；runtime 錯誤堆疊已整段省略。', run:'原掃描狀態', status:'Finding 狀態', fileHash:'原報告所記檔案 SHA-256（未重新核實來源位元組）', source:'歷史來源位元組未重新核實，commit 未知。tag 行號僅為公開參考。', reference:'公開來源參考', original:'開啟 JSON 原檔', idle:'按下按鈕後才載入並核對附件。' },
  en: { view:'View original excerpt', loading:'Checking excerpt…', retry:'Check original excerpt again', error:'The original excerpt could not be checked. No artifact content is displayed. Retry or open the JSON yourself.', matched:'Artifact bytes match the digest and data fields recorded on this page.', boundary:'This check does not establish historical execution, vulnerability validity, human confirmation or a signature. The original report is not public.', finding:'Original finding text', review:'Original review and verdict', omitted:'No valid review text is available; the runtime error trace was excluded in full.', run:'Original scan status', status:'Finding status', fileHash:'Report-recorded file SHA-256 (historical source bytes not rechecked)', source:'Historical source bytes were not rechecked; the commit is unknown. The tag and line link is a public reference only.', reference:'Public source reference', original:'Open original JSON', idle:'The artifact is fetched and checked only after you press the button.' },
};

export default function DossierPreview({ item }) {
  const t = labels[useLocale()];
  const [state, setState] = useState({ phase: 'idle' });
  const session = useRef(null);
  useEffect(() => {
    const current = createDossierSession(setState);
    session.current = current;
    return () => { current.dispose(); if (session.current === current) session.current = null; };
  }, [item.id, item.dossier.sha256]);
  const visible = previewStateFor(state, item);
  const dossier = visible.phase === 'verified' ? visible.dossier : null;
  return <div className="evidence__preview">
    <p>{t.idle}</p>
    <button className="evidence__preview-button" type="button" disabled={visible.phase === 'loading'} onClick={() => session.current?.load(item)}>{visible.phase === 'loading' ? t.loading : visible.phase === 'error' ? t.retry : t.view}</button>
    <a className="evidence__preview-original" href={item.dossier.artifactPath} target="_blank" rel="noopener noreferrer">{t.original}</a>
    {visible.phase === 'loading' && <p role="status">{t.loading}</p>}
    {visible.phase === 'error' && <p role="alert">{t.error}</p>}
    {dossier && <DossierExcerpt dossier={dossier} />}
  </div>;
}

export function DossierExcerpt({ dossier }) {
  const t = labels[useLocale()];
  return <div data-evidence-verified="true" className="evidence__preview-content">
      <p>{t.matched}</p><p>{t.boundary}</p>
      <h3>{t.finding}</h3><p>{dossier.finding.title}</p><pre><code>{dossier.finding.snippet}</code></pre>
      <dl className="evidence__facts"><div><dt>{t.status}</dt><dd>{dossier.finding.status}</dd></div><div><dt>{t.run}</dt><dd>{dossier.scan.runStatus}{dossier.scan.incompleteReason ? ` / ${dossier.scan.incompleteReason}` : ''}</dd></div></dl>
      <h3>{t.review}</h3><p>{dossier.review.model} / {dossier.review.family}: {dossier.review.verdict}</p>
      {dossier.review.detail === null ? <p>{t.omitted}</p> : <p className="evidence__preview-review">{dossier.review.detail}</p>}
      <p>{t.source}</p><a href={dossier.publicSource.url} target="_blank" rel="noopener noreferrer">{t.reference}</a>
      <details className="evidence__digest"><summary>{t.fileHash}</summary><code>{dossier.finding.reportedFileSha256}</code></details>
    </div>;
}
