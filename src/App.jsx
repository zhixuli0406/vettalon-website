import { content } from './i18n.js';
import { LocaleCtx } from './locale.js';
import { useReveal } from './useReveal.js';
import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import Product from './components/Product.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import Benchmarks from './components/Benchmarks.jsx';
import Editions from './components/Editions.jsx';
import Faq from './components/Faq.jsx';
import Contact from './components/Contact.jsx';
import SiteFooter from './components/SiteFooter.jsx';

export default function App({ locale = 'zh' }) {
  useReveal();
  const t = content[locale] ?? content.zh;
  return (
    <LocaleCtx.Provider value={{ locale, t }}>
      <div className="island">
        <a className="sr-only" href="#main-content">
          {locale === 'en' ? 'Skip to content' : '跳到主要內容'}
        </a>
        <Nav />
        <main id="main-content">
          <Hero />
          <Product />
          <HowItWorks />
          <Benchmarks />
          <Editions />
          <Faq />
          <Contact />
        </main>
        <SiteFooter />
      </div>
    </LocaleCtx.Provider>
  );
}
