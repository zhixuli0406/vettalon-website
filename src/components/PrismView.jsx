'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import { useLocale } from '../locale.js';
import { ReviewCtx } from '../prism/review-context.js';

const copy = {
  zh: { title: '折射稜鏡：覆核流程的視覺示意', stages: ['Finder', 'Verifier', 'Human'], descriptions: ['一個輸入，形成候選。', '換個方向，交叉挑戰。', '留下理由，交到人手上。'], pause: '暫停光路', play: '播放光路', left: '向左看', right: '向右看', note: '光路為覆核流程的視覺隱喻，非掃描結果。', select: '選擇覆核光路', fallback: '已改用靜態光路圖。你仍可繼續操作下方覆核案例。' },
  en: { title: 'A refractive prism illustrating the review process', stages: ['Finder', 'Verifier', 'Human'], descriptions: ['One input. A candidate emerges.', 'Another angle. A challenge.', 'Reasons, ready for a human.'], pause: 'Pause light', play: 'Play light', left: 'Look left', right: 'Look right', note: 'An optical metaphor for review, not scan output.', select: 'Choose a review light path', fallback: 'Showing a still light-path image. The review examples remain available.' },
};

export default function PrismView() {
  const locale = useLocale();
  const t = copy[locale];
  const { state, dispatch } = useContext(ReviewCtx);
  const host = useRef(null);
  const figure = useRef(null);
  const motion = useRef(null);
  const scene = useRef(null);
  const current = useRef(state.stage);
  const pausedRef = useRef(false);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let cancelled = false;
    let importing = false;
    const target = host.current;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const dark = window.matchMedia('(prefers-color-scheme: dark)');
    const fallback = () => {
      if (cancelled) return;
      if (motion.current?.contains(document.activeElement)) figure.current?.focus({ preventScroll: true });
      setReady(false); setNotice(t.fallback);
    };
    const start = async () => {
      if (importing || cancelled) return;
      importing = true;
      try {
        const { mountPrism } = await import('../prism/scene.js');
        if (cancelled) return;
        const instance = await mountPrism(target, { stage: current.current, paused: pausedRef.current, reduced: reduce.matches, dark: dark.matches, onReady: () => { if (!cancelled) setReady(true); }, onFallback: fallback });
        if (cancelled) instance.dispose(); else { scene.current = instance; instance.setStage(current.current); instance.setPaused(pausedRef.current); instance.setReduced(reduce.matches); instance.setDark(dark.matches); }
      } catch {
        if (!cancelled) { target.dataset.status = 'fallback'; fallback(); }
      }
    };
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
    }, { rootMargin: '200px' }) : null;
    const observe = () => observer ? observer.observe(target) : start();
    const idle = window.requestIdleCallback ? window.requestIdleCallback(observe, { timeout: 1400 }) : window.setTimeout(observe, 200);
    const onReduce = () => scene.current?.setReduced(reduce.matches);
    const onDark = () => scene.current?.setDark(dark.matches);
    reduce.addEventListener('change', onReduce); dark.addEventListener('change', onDark);
    return () => {
      cancelled = true; observer?.disconnect();
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle); else window.clearTimeout(idle);
      reduce.removeEventListener('change', onReduce); dark.removeEventListener('change', onDark);
      scene.current?.dispose(); scene.current = null;
    };
  }, [t.fallback]);
  useEffect(() => { current.current = state.stage; scene.current?.setStage(state.stage); }, [state.stage]);
  useEffect(() => { pausedRef.current = paused; scene.current?.setPaused(paused); }, [paused]);
  return (
    <figure className="prism-stage" ref={figure} tabIndex={-1} id="prism-visual" aria-label={t.title} data-prism-stage={state.stage}>
      <div className="prism-stage__field" ref={host} data-prism-host data-status="poster" aria-hidden="true">
        <picture className="prism-poster">
          <source media="(prefers-color-scheme: dark)" srcSet="/brand/prism-poster-dark.png" />
          <img src="/brand/prism-poster.png" alt="" width="1200" height="900" fetchPriority="high" />
        </picture>
      </div>
      <div className="prism-stage__caption"><span className="prism-stage__step">0{state.stage + 1}</span><p>{t.descriptions[state.stage]}</p></div>
      <div className="prism-controls">
        <div className="prism-controls__stages" role="group" aria-label={t.select}>
          {t.stages.map((label, index) => <button key={label} type="button" aria-pressed={state.stage === index} onClick={() => dispatch({ type: 'stage', stage: index })}>{label}</button>)}
        </div>
        {ready && <div className="prism-controls__motion" ref={motion}>
          <button type="button" onClick={() => scene.current?.turn(-1)} aria-label={t.left}><ArrowLeft size={16} aria-hidden="true" /></button>
          <button type="button" onClick={() => setPaused((v) => !v)} aria-pressed={paused} aria-label={paused ? t.play : t.pause}>{paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}</button>
          <button type="button" onClick={() => scene.current?.turn(1)} aria-label={t.right}><ArrowRight size={16} aria-hidden="true" /></button>
        </div>}
      </div>
      <figcaption className="prism-stage__note">{t.note}<span className="prism-notice" role="status" aria-live="polite">{notice}</span></figcaption>
    </figure>
  );
}
