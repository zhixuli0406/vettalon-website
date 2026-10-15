import { StrictMode } from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import '@fontsource-variable/inter';
import '@fontsource-variable/geist-mono';
import './index.css';
import App from './App.jsx';

// Locale from the path: /en/ → English, anything else → zh-TW.
const locale = window.location.pathname.startsWith('/en') ? 'en' : 'zh';

const root = document.getElementById('root');
const app = (
  <StrictMode>
    <App locale={locale} />
  </StrictMode>
);

// The prerender writes server-rendered markup into #root; hydrate it when
// present, otherwise mount fresh (dev server).
if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
