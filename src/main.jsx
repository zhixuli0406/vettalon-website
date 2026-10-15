import { StrictMode } from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { parseRoute } from './route.js';

// Locale and page from the path: /en/... → English, else zh-TW;
// /terms/, /privacy/, /refund/ → legal pages.
const { locale, page } = parseRoute(window.location.pathname);

const root = document.getElementById('root');
const app = (
  <StrictMode>
    <App locale={locale} page={page} />
  </StrictMode>
);

// The prerender writes server-rendered markup into #root; hydrate it when
// present, otherwise mount fresh (dev server).
if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
