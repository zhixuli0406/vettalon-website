import { ArrowUpRight } from 'lucide-react';
import { useT } from '../locale.js';
import SectionHead from './SectionHead.jsx';

export default function Contact() {
  const { contact } = useT();
  return (
    <section className="sect" id="contact">
      <SectionHead tag={contact.tag} lead={contact.lead} />
      <div className="contact rv">
        {contact.options.map((o) => (
          <div className="contact__item" key={o.t}>
            <h3>{o.t}</h3>
            <p>{o.d}</p>
            <a className="link" href={o.href} target="_blank" rel="noopener noreferrer">
              {o.cta} <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
