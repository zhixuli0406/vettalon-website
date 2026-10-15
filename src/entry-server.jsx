import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App.jsx';

// Rendered at build time by scripts/prerender.mjs, once per locale, to produce
// static HTML crawlers can read without running JS.
export function render(locale) {
  return renderToString(
    <StrictMode>
      <App locale={locale} />
    </StrictMode>,
  );
}
