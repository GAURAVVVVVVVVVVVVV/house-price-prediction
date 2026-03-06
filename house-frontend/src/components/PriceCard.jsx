import { useEffect, useRef, useState } from "react";

function formatINR(v) {
  if (!v) return "—";
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(2)} L`;
  return `₹${v.toLocaleString("en-IN")}`;
}

export default function PriceCard({ result, form }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!result) return;
    if (ref.current) clearInterval(ref.current);
    const target = result.predicted_price;
    let step = 0;
    const steps = 70;
    setDisplay(0);
    ref.current = setInterval(() => {
      step++;
      const ease = 1 - Math.pow(1 - step / steps, 4);
      setDisplay(Math.round(target * ease));
      if (step >= steps) { clearInterval(ref.current); setDisplay(target); }
    }, 1000 / steps);
    return () => clearInterval(ref.current);
  }, [result]);

  if (!result) return null;

  const tags = [
    { label: "Price / sqft",  val: `₹${result.price_per_sqft?.toLocaleString("en-IN")}` },
    { label: "Confidence",    val: `${result.confidence}%` },
    { label: "City",          val: form.city },
    { label: "Locality",      val: form.locality_tier },
    { label: "Furnishing",    val: form.furnishing },
    { label: "Config",        val: `${form.bhk} BHK · Fl ${form.floor_no}` },
  ];

  return (
    <div className="result-hero anim-in">
      <div className="result-eyebrow">✦ Estimated Market Value</div>
      <div className="result-price">{formatINR(display)}</div>
      <div className="result-range">
        Range: {formatINR(result.price_low)} – {formatINR(result.price_high)}
      </div>
      <div className="result-tags">
        {tags.map(t => (
          <div key={t.label} className="result-tag">
            <span className="result-tag-label">{t.label}</span>
            <span className="result-tag-val">{t.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
