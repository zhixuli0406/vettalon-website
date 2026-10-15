import { useEffect } from 'react';

/**
 * Fades .rv elements in as they scroll into view (once).
 * The prerendered HTML is fully visible; hiding only starts after hydration
 * (html.rv-ready), and elements already on screen are marked first so nothing
 * above the fold flickers.
 */
export function useReveal() {
  useEffect(() => {
    const els = [...document.querySelectorAll('.rv')];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const vh = window.innerHeight;
    els.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) el.classList.add('is-in');
    });
    document.documentElement.classList.add('rv-ready');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    els.forEach((el) => {
      if (!el.classList.contains('is-in')) io.observe(el);
    });
    return () => io.disconnect();
  }, []);
}
