import { ArrowUpRight } from 'lucide-react';
import { useLocale } from '../locale.js';
import { GITHUB } from '../i18n.js';
import RealSample from './RealSample.jsx';

export default function Report() {
  const en = useLocale() === 'en';
  return <section className="sect report-section" id="report" aria-labelledby="report-title">
    <header className="report-section__intro"><p className="eyebrow">{en ? '02 / Inspect the evidence' : '02 / 再看留下的證據'}</p><h2 className="sect__title" id="report-title">{en ? 'Start with real output.' : '先看真實輸出。'}</h2><p className="sect__lead">{en ? 'This is the CLI example published in the project README. It records candidates, refutations, coverage and cross-family review.' : '這是專案 README 公開的 CLI 範例，保留候選、證偽、覆蓋範圍與跨家族覆核紀錄。'}</p><a className="link" href={GITHUB + '#sample-output'} target="_blank" rel="noopener noreferrer">{en ? 'Inspect the source on GitHub' : '到 GitHub 核對來源'}<ArrowUpRight size={17} aria-hidden="true" /></a></header>
    <RealSample open />
  </section>;
}
