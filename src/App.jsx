import { useReducer } from 'react';
import { reviewReducer, initialReviewState } from './review-demo.js';
import { ReviewCtx } from './prism/review-context.js';
import { content } from './i18n.js';
import { LocaleCtx } from './locale.js';
import { useReveal } from './useReveal.js';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import Report from './components/Report.jsx';
import Product from './components/Product.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import Benchmarks from './components/Benchmarks.jsx';
import Editions from './components/Editions.jsx';
import Faq from './components/Faq.jsx';
import Contact from './components/Contact.jsx';
import SiteFooter from './components/SiteFooter.jsx';
import LegalPage from './components/LegalPage.jsx';
import EvidencePage from './components/EvidencePage.jsx';
import DownloadPage from './components/DownloadPage.jsx';

// page: '' renders the landing page; 'terms' | 'privacy' | 'refund' render a
// legal page inside the same shell (nav + footer).
export default function App({ locale = 'zh', page = '' }) {
  useReveal();
  const [reviewState, dispatchReview] = useReducer(reviewReducer, initialReviewState);
  const t = content[locale] ?? content.zh;
  return (
    <LocaleCtx.Provider value={{ locale, t, page }}>
      <div className="site">
        <a className="sr-only" href="#main-content">
          {locale === 'en' ? 'Skip to content' : '跳到主要內容'}
        </a>
        <Nav />
        <main id="main-content" tabIndex={-1}>
          {page.startsWith('evidence') ? (
            <EvidencePage page={page} />
          ) : page === 'download' ? (
            <DownloadPage />
          ) : page ? (
            <LegalPage page={page} />
          ) : (
            <>
              <ReviewCtx.Provider value={{ state: reviewState, dispatch: dispatchReview }}><Hero /></ReviewCtx.Provider>
              <Report />
              <Benchmarks />
              <Product />
              <HowItWorks />
              <Editions />
              <Faq />
              <Contact />
            </>
          )}
        </main>
        <SiteFooter />
      </div>
    </LocaleCtx.Provider>
  );
}
