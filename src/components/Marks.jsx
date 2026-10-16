// Use the delivered color PNG artwork in every color scheme.
function BrandMark({ name, size, className }) {
  return (
    <img
      className={`logo ${className}`.trim()}
      src={`/brand/${name}-mark.png`}
      alt=""
      width={size}
      height={size}
    />
  );
}

export function VettalonMark({ size = 32, className = '' }) {
  return <BrandMark name="vettalon" size={size} className={className} />;
}

export function CompanyMark({ size = 32, className = '' }) {
  return <BrandMark name="company" size={size} className={className} />;
}
