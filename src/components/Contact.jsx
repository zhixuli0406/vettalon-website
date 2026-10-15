import { ArrowUpRight } from 'lucide-react';
import { useT } from '../locale.js';

export default function Contact() {
  const { contact } = useT();
  return (
    <section className="sect sect--compact" id="contact">
      <p className="sect__tag rv">{contact.tag}</p>
      <div className="contact-options rv">
        {contact.options.map((o) => (
          <div className="contact-option" key={o.t}>
            <h3>{o.t}</h3>
            <p>{o.d}</p>
            <a href={o.href} target="_blank" rel="noopener noreferrer">
              {o.cta} <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
