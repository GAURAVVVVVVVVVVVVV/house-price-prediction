import { useState } from "react";

function formatINR(v) {
  const abs = Math.abs(v);
  if (abs >= 10000000) return `₹${(v/10000000).toFixed(2)} Cr`;
  if (abs >= 100000)   return `₹${(v/100000).toFixed(1)} L`;
  if (abs >= 1000)     return `₹${(v/1000).toFixed(1)}K`;
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

function formatINRabs(v) {
  return formatINR(Math.abs(v));
}

const FEAT_ICONS = {
  "Bedrooms (BHK)":        "🛏",
  "Bathrooms":             "🚿",
  "Super Area":            "📐",
  "Carpet Area":           "🏠",
  "Floor Number":          "🏢",
  "Total Floors":          "🏗",
  "Property Age":          "📅",
  "Parking Spots":         "🚗",
  "Lift Available":        "🛗",
  "Gated Society":         "🔒",
  "City":                  "🏙",
  "Locality Tier":         "📍",
  "Metro Distance":        "🚇",
  "City Center Distance":  "🗺",
  "School Proximity":      "🏫",
  "Hospital Proximity":    "🏥",
  "Crime Rate":            "🛡",
  "City Price Level":      "💰",
  "Area Efficiency":       "📊",
  "Floor Position":        "⬆",
  "Room Density":          "📦",
  "Transit Proximity":     "🚌",
  "Services Nearby":       "⭐",
  "Safety Score":          "✅",
  "Premium Locality":      "💎",
  "Budget Locality":       "💵",
  "New Property":          "✨",
  "Furnishing Status":     "🛋",
};

export default function ShapExplainer({ formData }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [expanded, setExpanded] = useState(false);

  const handleExplain = async () => {
    setLoading(true); setError(""); setData(null);
    try {
      const res = await fetch("http://localhost:8000/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error();
      setData(await res.json());
      setExpanded(true);
    } catch {
      setError("Could not fetch explanation. Make sure backend is running.");
    }
    setLoading(false);
  };

  const shown = data
    ? (expanded ? data.contributions : data.contributions.slice(0, 6))
    : [];

  const maxAbs = data
    ? Math.max(...data.contributions.map(c => Math.abs(c.impact_inr)))
    : 1;

  return (
    <div className="card anim-up" style={{ borderColor:"rgba(124,110,255,0.2)" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
        <div>
          <div className="card-label">🔬 SHAP Price Explanation</div>
          <div style={{ fontSize:13, color:"var(--text-md)", maxWidth:420 }}>
            AI explains exactly <strong style={{color:"var(--text-hi)"}}>why</strong> this
            property got this price — which features added value and which reduced it.
          </div>
        </div>
        <button
          onClick={handleExplain}
          disabled={loading || !formData}
          style={{
            padding:"10px 18px", border:"1px solid rgba(124,110,255,0.35)",
            borderRadius:"var(--r)", background:"rgba(124,110,255,0.1)",
            color:"#c4baff", fontFamily:"'Cabinet Grotesk',sans-serif",
            fontSize:13, fontWeight:800, cursor:"pointer",
            transition:"all 0.2s", whiteSpace:"nowrap", flexShrink:0,
            opacity: loading || !formData ? 0.5 : 1,
          }}>
          {loading
            ? <><span className="spin" style={{borderTopColor:"#c4baff"}}/>Explaining...</>
            : "⬡ Explain Price"}
        </button>
      </div>

      {error && <div className="err">⚠ {error}</div>}

      {data && (
        <>
          {/* Base vs Predicted */}
          <div style={{
            display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:24
          }}>
            <div style={{
              background:"var(--bg-raised)", border:"1px solid var(--border)",
              borderRadius:"var(--r)", padding:"14px 18px"
            }}>
              <div style={{ fontSize:10, color:"var(--text-lo)", letterSpacing:1.5,
                textTransform:"uppercase", fontWeight:700, marginBottom:6 }}>
                Market Baseline
              </div>
              <div style={{
                fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:22,
                fontWeight:900, color:"var(--text-md)"
              }}>{formatINR(data.base_price)}</div>
              <div style={{ fontSize:11, color:"var(--text-lo)", marginTop:3 }}>
                Average property price in dataset
              </div>
            </div>
            <div style={{
              background:"rgba(124,110,255,0.07)",
              border:"1px solid rgba(124,110,255,0.25)",
              borderRadius:"var(--r)", padding:"14px 18px"
            }}>
              <div style={{ fontSize:10, color:"var(--accent)", letterSpacing:1.5,
                textTransform:"uppercase", fontWeight:700, marginBottom:6 }}>
                Your Property
              </div>
              <div style={{
                fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:22,
                fontWeight:900, color:"var(--accent)"
              }}>{formatINR(data.predicted_price)}</div>
              <div style={{ fontSize:11, color:"var(--text-lo)", marginTop:3 }}>
                {data.predicted_price > data.base_price
                  ? `+${formatINR(data.predicted_price - data.base_price)} above baseline`
                  : `${formatINR(data.predicted_price - data.base_price)} below baseline`}
              </div>
            </div>
          </div>

          {/* Waterfall bars */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:"var(--text-lo)", letterSpacing:1.5,
              textTransform:"uppercase", fontWeight:700, marginBottom:14 }}>
              Feature Impact on Price
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {shown.map((c, i) => {
                const positive  = c.impact_inr >= 0;
                const barWidth  = Math.abs(c.impact_inr) / maxAbs * 100;
                const color     = positive ? "var(--green)" : "var(--rose)";
                const icon      = FEAT_ICONS[c.feature] || "◈";

                return (
                  <div key={c.raw_name}
                    style={{ animation:`fadeUp 0.4s ease ${i*0.04}s both` }}>
                    <div style={{
                      display:"grid",
                      gridTemplateColumns:"28px 180px 1fr 90px",
                      alignItems:"center", gap:10
                    }}>
                      {/* Icon */}
                      <div style={{ fontSize:16, textAlign:"center" }}>{icon}</div>

                      {/* Feature name */}
                      <div style={{ fontSize:13, color:"var(--text-hi)",
                        fontWeight:500, whiteSpace:"nowrap", overflow:"hidden",
                        textOverflow:"ellipsis" }}>
                        {c.feature}
                      </div>

                      {/* Bar */}
                      <div style={{ position:"relative", height:8,
                        background:"rgba(255,255,255,0.05)", borderRadius:4 }}>
                        <div style={{
                          position:"absolute",
                          left: positive ? "50%" : `calc(50% - ${barWidth/2}%)`,
                          width:`${barWidth/2}%`,
                          height:"100%",
                          borderRadius:4,
                          background: color,
                          transition:"width 0.8s ease",
                          [positive ? "left" : "right"]: positive ? "50%" : undefined,
                        }}/>
                        {/* Center line */}
                        <div style={{
                          position:"absolute", left:"50%", top:0,
                          width:1, height:"100%",
                          background:"rgba(255,255,255,0.15)"
                        }}/>
                      </div>

                      {/* Value */}
                      <div style={{
                        fontFamily:"'JetBrains Mono',monospace", fontSize:12,
                        fontWeight:600, color,
                        textAlign:"right", whiteSpace:"nowrap"
                      }}>
                        {positive ? "+" : "−"}{formatINRabs(c.impact_inr)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Show more / less */}
          {data.contributions.length > 6 && (
            <button onClick={() => setExpanded(e => !e)} style={{
              width:"100%", padding:"10px", border:"1px solid var(--border-md)",
              borderRadius:"var(--r)", background:"transparent",
              color:"var(--text-md)", fontFamily:"'Satoshi',sans-serif",
              fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.2s"
            }}>
              {expanded
                ? "▲ Show less"
                : `▼ Show all ${data.contributions.length} features`}
            </button>
          )}

          {/* Legend */}
          <div style={{
            display:"flex", gap:20, marginTop:16,
            padding:"12px 16px", background:"var(--bg-raised)",
            borderRadius:"var(--r)", fontSize:12, color:"var(--text-lo)"
          }}>
            <span style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ width:12, height:12, borderRadius:2,
                background:"var(--green)", display:"inline-block" }}/>
              Increases price
            </span>
            <span style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ width:12, height:12, borderRadius:2,
                background:"var(--rose)", display:"inline-block" }}/>
              Decreases price
            </span>
            <span style={{ marginLeft:"auto" }}>
              Powered by SHAP (SHapley Additive exPlanations)
            </span>
          </div>
        </>
      )}

      {!data && !loading && (
        <div style={{
          textAlign:"center", padding:"32px 0",
          color:"var(--text-lo)", fontSize:13
        }}>
          Click <strong style={{color:"var(--accent)"}}>Explain Price</strong> after
          predicting to see what's driving the valuation
        </div>
      )}
    </div>
  );
}
