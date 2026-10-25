import { ArrowUpRight, ArrowDown } from 'lucide-react';
import { useLocale } from '../locale.js';
import { GITHUB } from '../i18n.js';
import { DESKTOP_VERSION } from '../downloads.js';
import PrismView from './PrismView.jsx';
import ReviewDemo from './ReviewDemo.jsx';

const copy = {
  zh: { kicker: 'Vettalon / 程式碼安全稽核', title: '多模型交叉覆核', line: '程式碼風險。', lead: `不同家族的模型先互相挑戰。對符合目前 Python 限定格式的候選，${DESKTOP_VERSION} 還能綁定實際原始碼重現效果，或在隔離副本中檢查修補，不改你的工作目錄。最後仍由人判定。`, primary: '試用開源版', secondary: '看真實輸出', note: 'Apache 2.0 開源核心 · CLI / CI · 模型由你選擇', step: '01 / 先理解判斷過程', review: '如果模型說有問題，', reviewLine: '誰來挑戰它？', intro: '選一段程式碼，看看同一個候選如何被提出、駁回或交給人工。' },
  en: { kicker: 'Vettalon / Code security audit', title: 'Cross-review code risks.', line: 'Across model families.', lead: `Different model families challenge each other first. For supported Python findings, ${DESKTOP_VERSION} can reproduce the effect against the exact source or check a candidate fix in an isolated copy—without changing your working tree. The final call stays with you.`, primary: 'Try the open-source core', secondary: 'Read real output', note: 'Apache 2.0 core · CLI / CI · Your choice of models', step: '01 / Understand the judgment', review: 'A model finds a risk.', reviewLine: 'Who challenges it?', intro: 'Choose a code example. Follow a candidate as it is proposed, refuted or handed to a person.' },
};

export default function Hero() {
  const t = copy[useLocale()];
  return (
    <>
      <section className="hero" id="prism-hero" aria-labelledby="hero-title">
        <div className="hero__in">
          <p className="eyebrow">{t.kicker}</p>
          <h1 id="hero-title">{t.title}<span>{t.line}</span></h1>
          <div className="hero__decision"><p className="hero__lead">{t.lead}</p><div className="hero__cta">
            <a className="btn btn--primary" href={GITHUB} target="_blank" rel="noopener noreferrer">{t.primary}<ArrowUpRight size={18} aria-hidden="true" /></a>
            <a className="btn btn--secondary" href="#report">{t.secondary}<ArrowDown size={18} aria-hidden="true" /></a>
          </div></div>
          <p className="hero__note">{t.note}</p>
        </div>
      </section>
      <section className="review-section sect" id="review" aria-labelledby="review-heading">
        <header className="journey-heading"><p className="eyebrow">{t.step}</p><h2 className="sect__title" id="review-heading">{t.review}<br /><span>{t.reviewLine}</span></h2><p className="sect__lead">{t.intro}</p></header>
        <div className="journey-layout">
          <div className="prism-stage-wrap"><PrismView /></div>
          <ReviewDemo />
        </div>
      </section>
    </>
  );
}
