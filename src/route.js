import { LEGAL_PAGES } from './legal.js';

// Map a URL path to { locale, page }. Shared by the client entry and the
// prerender so both agree on which pages exist.
export function parseRoute(pathname) {
  const locale = /^\/en(?:\/|$)/.test(pathname) ? 'en' : 'zh';
  const rest = pathname.replace(/^\/en(?=\/|$)/, '').replace(/^\/+|\/+$/g, '');
  const page = LEGAL_PAGES.includes(rest) || rest === 'download' || /^evidence(?:\/[a-z0-9-]+)?$/.test(rest) ? rest : '';
  return { locale, page };
}
