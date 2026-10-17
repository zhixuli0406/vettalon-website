import { useEffect } from 'react';

export function useReveal() {
  useEffect(() => {
    document.documentElement.classList.add('js-ready');
    if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const active = new Set();
    const observer = new IntersectionObserver((entries) => {
      if (reduce.matches) return;
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        observer.unobserve(target);
        const animation = target.animate([{ transform: 'translateY(16px)' }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.16,1,.3,1)' });
        active.add(animation);
        animation.onfinish = () => active.delete(animation);
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.rv').forEach((el) => observer.observe(el));
    const stop = () => { if (reduce.matches) { active.forEach((animation) => animation.cancel()); active.clear(); } };
    reduce.addEventListener('change', stop);
    return () => { observer.disconnect(); reduce.removeEventListener('change', stop); active.forEach((animation) => animation.cancel()); };
  }, []);
}
