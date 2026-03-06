import { useState } from "react";

export default function PDFReport({ formData, result }) {
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [error,   setError]   = useState("");

  const handleDownload = async () => {
    if (!formData || !result) return;
    setLoading(true); setDone(false); setError("");

    try {
      const API = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const res = await fetch(`${API}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      // Stream PDF blob and trigger browser download
      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const city     = formData.city?.toLowerCase().replace(/ /g,"_") || "city";
      const bhk      = formData.bhk || 2;
      const filename = `ProphetAI_Report_${city}_${bhk}bhk.pdf`;

      const a  = document.createElement("a");
      a.href   = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch (e) {
      setError("Could not generate PDF. Make sure reportlab is installed: pip install reportlab");
    }
    setLoading(false);
  };

  const disabled = loading || !formData || !result;

  return (
    <div className="card anim-up" style={{
      borderColor: "rgba(245,200,66,0.2)",
      background: "linear-gradient(135deg, rgba(245,200,66,0.04) 0%, rgba(124,110,255,0.04) 100%)"
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>

        {/* Left: info */}
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          {/* Icon box */}
          <div style={{
            width:52, height:52, borderRadius:14, flexShrink:0,
            background:"rgba(245,200,66,0.12)",
            border:"1px solid rgba(245,200,66,0.25)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:26
          }}>📄</div>

          <div>
            <div style={{
              fontFamily:"'Cabinet Grotesk',sans-serif",
              fontWeight:800, fontSize:15, color:"var(--text-hi)", marginBottom:3
            }}>
              Download Valuation Report
            </div>
            <div style={{ fontSize:12, color:"var(--text-md)", lineHeight:1.5 }}>
              2-page branded PDF · Price prediction · SHAP explanation ·
              EMI table · Property summary
            </div>
          </div>
        </div>

        {/* Right: button */}
        <button
          onClick={handleDownload}
          disabled={disabled}
          style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"12px 24px",
            background: done
              ? "linear-gradient(135deg,var(--green),#2ab87e)"
              : disabled
              ? "rgba(245,200,66,0.15)"
              : "linear-gradient(135deg,var(--gold),#e8a030)",
            border:"none", borderRadius:"var(--r)",
            color: done ? "#fff" : disabled ? "rgba(245,200,66,0.4)" : "#0a0810",
            fontFamily:"'Cabinet Grotesk',sans-serif",
            fontSize:14, fontWeight:800,
            cursor: disabled ? "not-allowed" : "pointer",
            transition:"all 0.25s",
            boxShadow: !disabled && !done ? "0 4px 20px rgba(245,200,66,0.25)" : "none",
            whiteSpace:"nowrap", flexShrink:0,
          }}>
          {loading ? (
            <>
              <span className="spin"
                style={{ borderTopColor:"#0a0810", borderColor:"rgba(10,8,16,0.25)" }}/>
              Generating PDF...
            </>
          ) : done ? (
            <>✅ Downloaded!</>
          ) : (
            <>⬇ Download PDF</>
          )}
        </button>
      </div>

      {/* What's inside chips */}
      {!error && (
        <div style={{
          display:"flex", flexWrap:"wrap", gap:8, marginTop:16,
          paddingTop:14, borderTop:"1px solid var(--border)"
        }}>
          {[
            "📊 Price Prediction",
            "🔬 SHAP AI Explanation",
            "🧮 4 EMI Scenarios",
            "🏠 Full Property Details",
            "📈 Market Context",
          ].map(item => (
            <span key={item} style={{
              fontSize:11, fontWeight:600,
              color:"var(--text-md)",
              background:"var(--bg-raised)",
              border:"1px solid var(--border-md)",
              borderRadius:20, padding:"4px 12px"
            }}>{item}</span>
          ))}
        </div>
      )}

      {error && (
        <div className="err" style={{ marginTop:14, marginBottom:0 }}>
          ⚠ {error}
        </div>
      )}

      {!result && (
        <div style={{
          marginTop:14, paddingTop:14, borderTop:"1px solid var(--border)",
          fontSize:12, color:"var(--text-lo)", textAlign:"center"
        }}>
          Predict a price first to enable the PDF download
        </div>
      )}
    </div>
  );
}
