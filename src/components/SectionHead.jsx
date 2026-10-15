// Section heading: h2 title plus an optional supporting sentence.
export default function SectionHead({ tag, lead }) {
  return (
    <div className="sect__head">
      <h2 className="sect__title rv">{tag}</h2>
      {lead ? <p className="sect__lead rv">{lead}</p> : null}
    </div>
  );
}
