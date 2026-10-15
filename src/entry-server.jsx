import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App.jsx';

// Rendered at build time by scripts/prerender.mjs, once per locale and page, to produce
// static HTML crawlers can read without running JS.
export function render(locale, page = '') {
  return renderToString(
    <StrictMode>
      <App locale={locale} page={page} />
    </StrictMode>,
  );
}
