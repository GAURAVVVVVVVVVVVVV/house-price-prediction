import { useState, useRef, useCallback } from "react";

function formatINR(v) {
  if (!v) return "—";
  const abs = Math.abs(v);
  if (abs >= 10000000) return `₹${(v/10000000).toFixed(2)} Cr`;
  if (abs >= 100000)   return `₹${(v/100000).toFixed(1)} L`;
  if (abs >= 1000)     return `₹${(v/1000).toFixed(1)}K`;
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

function ScoreRing({ score }) {
  const pct    = score / 10;
  const r      = 54;
  const circ   = 2 * Math.PI * r;
  const dash   = pct * circ;
  const color  = score >= 8 ? "var(--green)" : score >= 6 ? "var(--gold)" : score >= 4 ? "#f59e42" : "var(--rose)";
  const label  = score >= 8 ? "Excellent" : score >= 6 ? "Good" : score >= 4 ? "Average" : "Poor";

  return (
    <div style={{ position:"relative", width:140, height:140, flexShrink:0 }}>
      <svg width="140" height="140" style={{ transform:"rotate(-90deg)" }}>
        <circle cx="70" cy="70" r={r} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth="10"/>
        <circle cx="70" cy="70" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition:"stroke-dasharray 1s cubic-bezier(0.34,1.56,0.64,1)" }}/>
      </svg>
      <div style={{
        position:"absolute", inset:0,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
      }}>
        <div style={{
          fontFamily:"'Cabinet Grotesk',sans-serif",
          fontSize:32, fontWeight:900,
          color, lineHeight:1,
        }}>{score.toFixed(1)}</div>
        <div style={{ fontSize:11, color:"var(--text-lo)", marginTop:2 }}>/10</div>
        <div style={{ fontSize:11, fontWeight:700, color, marginTop:4 }}>{label}</div>
      </div>
    </div>
  );
}

function BarMeter({ label, value, max=10, color="var(--accent)" }) {
  const pct = (value / max) * 100;
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
        <span style={{ fontSize:12, color:"var(--text-md)" }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:700, color, fontFamily:"'JetBrains Mono',monospace" }}>
          {value.toFixed(1)}/10
        </span>
      </div>
      <div style={{ height:6, background:"rgba(255,255,255,0.06)", borderRadius:3 }}>
        <div style={{
          height:"100%", borderRadius:3, background:color,
          width:`${pct}%`, transition:"width 1s cubic-bezier(0.34,1.56,0.64,1)"
        }}/>
      </div>
    </div>
  );
}

export default function ImageAnalysis({ basePrediction }) {
  const [dragging,  setDragging]  = useState(false);
  const [image,     setImage]     = useState(null);   // { url, file }
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [analyzed,  setAnalyzed]  = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, WEBP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }
    setError("");
    setResult(null);
    setAnalyzed(false);
    const url = URL.createObjectURL(file);
    setImage({ url, file });
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  }, []);

  const onDragOver  = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = ()  => setDragging(false);

  const handleAnalyze = async () => {
    if (!image?.file) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", image.file);
      const API = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const res = await fetch(`${API}/estimate-image`, {
        method:"POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Analysis failed");
      }
      const data = await res.json();
      setResult(data);
      setAnalyzed(true);
    } catch(e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const reset = () => {
    setImage(null); setResult(null);
    setError(""); setAnalyzed(false);
  };

  // Compute adjusted price if base prediction exists
  const adjustedPrice = basePrediction && result
    ? Math.round(basePrediction * (1 + result.price_adjustment_pct / 100))
    : null;
  const priceDiff = adjustedPrice && basePrediction
    ? adjustedPrice - basePrediction
    : null;

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow">📸 Vision AI</div>
        <div className="page-title">Image <span>Analysis</span></div>
        <div className="page-sub">
          Upload a property photo · Gemini Vision scores condition · Price adjusts automatically
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"420px 1fr", gap:28, alignItems:"start" }}>

        {/* ── LEFT: UPLOAD PANEL ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          {/* Upload card */}
          <div className="card">
            <div className="card-label">📸 Property Photo</div>

            {!image ? (
              /* Drop zone */
              <div
                onClick={() => inputRef.current?.click()}
                onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                style={{
                  border:`2px dashed ${dragging?"var(--accent)":"rgba(255,255,255,0.1)"}`,
                  borderRadius:"var(--r-lg)",
                  padding:"48px 24px",
                  textAlign:"center",
                  cursor:"pointer",
                  background: dragging ? "rgba(124,110,255,0.06)" : "var(--bg-raised)",
                  transition:"all 0.2s",
                }}>
                <div style={{ fontSize:48, marginBottom:14, opacity:0.7 }}>🏠</div>
                <div style={{
                  fontFamily:"'Cabinet Grotesk',sans-serif",
                  fontWeight:800, fontSize:16,
                  color: dragging?"var(--accent)":"var(--text-hi)",
                  marginBottom:8
                }}>
                  {dragging ? "Drop it here!" : "Drop property photo here"}
                </div>
                <div style={{ fontSize:13, color:"var(--text-lo)", marginBottom:16 }}>
                  or click to browse
                </div>
                <div style={{
                  display:"inline-flex", gap:8, flexWrap:"wrap",
                  justifyContent:"center"
                }}>
                  {["JPG","PNG","WEBP","Max 10MB"].map(t => (
                    <span key={t} style={{
                      fontSize:10, fontWeight:700, letterSpacing:1,
                      color:"var(--text-lo)",
                      background:"var(--bg-hover)",
                      border:"1px solid var(--border)",
                      borderRadius:20, padding:"3px 10px"
                    }}>{t}</span>
                  ))}
                </div>
                <input ref={inputRef} type="file" accept="image/*"
                  style={{ display:"none" }}
                  onChange={e => handleFile(e.target.files[0])}/>
              </div>
            ) : (
              /* Image preview */
              <div>
                <div style={{
                  position:"relative", borderRadius:"var(--r-lg)",
                  overflow:"hidden", marginBottom:14,
                  border:"1px solid var(--border-md)"
                }}>
                  <img src={image.url} alt="Property"
                    style={{ width:"100%", height:260, objectFit:"cover", display:"block" }}/>
                  {analyzed && (
                    <div style={{
                      position:"absolute", top:12, right:12,
                      background:"rgba(61,219,165,0.9)",
                      borderRadius:20, padding:"4px 12px",
                      fontSize:11, fontWeight:800, color:"#fff",
                      backdropFilter:"blur(8px)"
                    }}>✓ Analysed</div>
                  )}
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button onClick={handleAnalyze} disabled={loading || analyzed}
                    className="btn-predict" style={{ flex:1 }}>
                    {loading
                      ? <><span className="spin"/>Analysing with Gemini...</>
                      : analyzed
                      ? "✓ Analysis Complete"
                      : "🔍 Analyse Property"}
                  </button>
                  <button onClick={reset} style={{
                    padding:"12px 16px", border:"1px solid var(--border-md)",
                    borderRadius:"var(--r)", background:"var(--bg-raised)",
                    color:"var(--text-md)", cursor:"pointer",
                    fontFamily:"'Satoshi',sans-serif", fontWeight:600,
                    fontSize:13, transition:"all 0.15s"
                  }}>↺</button>
                </div>
              </div>
            )}

            {error && <div className="err" style={{ marginTop:14 }}>⚠ {error}</div>}
          </div>

          {/* Tips card */}
          <div className="card" style={{ borderColor:"rgba(245,200,66,0.15)" }}>
            <div className="card-label">💡 Tips for best results</div>
            {[
              ["📷","Use well-lit interior photos","Living room or kitchen works best"],
              ["🏠","Show the main living area","Avoid blurry or dark images"],
              ["🪟","Natural light preferred","Open curtains for accurate analysis"],
              ["📐","Wide-angle shots","Capture more of the room in one photo"],
            ].map(([icon, title, sub]) => (
              <div key={title} style={{
                display:"flex", gap:12, alignItems:"flex-start",
                marginBottom:12, padding:"10px 12px",
                background:"var(--bg-raised)", borderRadius:"var(--r)",
              }}>
                <span style={{ fontSize:20, flexShrink:0 }}>{icon}</span>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--text-hi)", marginBottom:2 }}>{title}</div>
                  <div style={{ fontSize:11, color:"var(--text-lo)" }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: RESULTS ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

          {result ? (
            <>
              {/* Score hero */}
              <div className="card anim-in" style={{
                borderColor:"rgba(124,110,255,0.25)",
                background:"linear-gradient(135deg,rgba(124,110,255,0.05),rgba(180,77,255,0.03))"
              }}>
                <div className="card-label">🔬 Condition Analysis</div>
                <div style={{ display:"flex", gap:24, alignItems:"center", marginBottom:24 }}>
                  <ScoreRing score={result.condition_score}/>
                  <div style={{ flex:1 }}>
                    <div style={{
                      fontFamily:"'Cabinet Grotesk',sans-serif",
                      fontSize:20, fontWeight:900,
                      color:"var(--text-hi)", marginBottom:8, lineHeight:1.3
                    }}>
                      {result.summary}
                    </div>
                    <div style={{
                      fontSize:13, color:"var(--text-md)",
                      padding:"8px 12px", background:"var(--bg-raised)",
                      borderRadius:"var(--r)", border:"1px solid var(--border)",
                      lineHeight:1.6
                    }}>
                      Price adjustment:{" "}
                      <strong style={{
                        color: result.price_adjustment_pct >= 0 ? "var(--green)" : "var(--rose)",
                        fontFamily:"'JetBrains Mono',monospace"
                      }}>
                        {result.price_adjustment_pct >= 0 ? "+" : ""}{result.price_adjustment_pct}%
                      </strong>
                      {" "}based on visual condition
                    </div>
                  </div>
                </div>

                {/* Sub scores */}
                {result.sub_scores && (
                  <div style={{ marginBottom:20 }}>
                    <div style={{ fontSize:11, color:"var(--text-lo)", letterSpacing:1.5,
                      textTransform:"uppercase", fontWeight:700, marginBottom:12 }}>
                      Detailed Scores
                    </div>
                    {Object.entries(result.sub_scores).map(([k, v]) => {
                      const color = v >= 7 ? "var(--green)" : v >= 5 ? "var(--gold)" : "var(--rose)";
                      return <BarMeter key={k} label={k} value={v} color={color}/>;
                    })}
                  </div>
                )}

                {/* Positives & Negatives */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div style={{
                    background:"rgba(61,219,165,0.06)",
                    border:"1px solid rgba(61,219,165,0.2)",
                    borderRadius:"var(--r)", padding:"14px"
                  }}>
                    <div style={{ fontSize:10, color:"var(--green)", letterSpacing:1.5,
                      textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>
                      ✅ Positive Factors
                    </div>
                    {(result.positive_factors || []).map((f, i) => (
                      <div key={i} style={{
                        fontSize:12, color:"var(--text-md)",
                        display:"flex", gap:7, alignItems:"flex-start", marginBottom:6
                      }}>
                        <span style={{ color:"var(--green)", flexShrink:0 }}>▸</span>
                        {f}
                      </div>
                    ))}
                    {(!result.positive_factors || result.positive_factors.length === 0) && (
                      <div style={{ fontSize:12, color:"var(--text-lo)" }}>None detected</div>
                    )}
                  </div>

                  <div style={{
                    background:"rgba(255,107,138,0.06)",
                    border:"1px solid rgba(255,107,138,0.2)",
                    borderRadius:"var(--r)", padding:"14px"
                  }}>
                    <div style={{ fontSize:10, color:"var(--rose)", letterSpacing:1.5,
                      textTransform:"uppercase", fontWeight:700, marginBottom:10 }}>
                      ⚠ Negative Factors
                    </div>
                    {(result.negative_factors || []).map((f, i) => (
                      <div key={i} style={{
                        fontSize:12, color:"var(--text-md)",
                        display:"flex", gap:7, alignItems:"flex-start", marginBottom:6
                      }}>
                        <span style={{ color:"var(--rose)", flexShrink:0 }}>▸</span>
                        {f}
                      </div>
                    ))}
                    {(!result.negative_factors || result.negative_factors.length === 0) && (
                      <div style={{ fontSize:12, color:"var(--text-lo)" }}>None detected</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Observations */}
              {result.observations && result.observations.length > 0 && (
                <div className="card anim-up delay-1">
                  <div className="card-label">👁 AI Observations</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {result.observations.map((obs, i) => (
                      <div key={i} style={{
                        display:"flex", gap:12, alignItems:"flex-start",
                        padding:"10px 14px",
                        background:"var(--bg-raised)",
                        border:"1px solid var(--border)",
                        borderRadius:"var(--r)",
                        fontSize:13, color:"var(--text-md)", lineHeight:1.5
                      }}>
                        <span style={{
                          width:22, height:22, borderRadius:6,
                          background:"var(--accent-glow)",
                          border:"1px solid rgba(124,110,255,0.2)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:11, fontWeight:800, color:"var(--accent)",
                          flexShrink:0
                        }}>{i+1}</span>
                        {obs}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Price impact card */}
              <div className="card anim-up delay-2" style={{
                borderColor: result.price_adjustment_pct >= 0
                  ? "rgba(61,219,165,0.25)"
                  : "rgba(255,107,138,0.25)"
              }}>
                <div className="card-label">💰 Price Impact</div>

                {basePrediction ? (
                  <>
                    <div style={{
                      display:"grid", gridTemplateColumns:"1fr auto 1fr",
                      gap:12, alignItems:"center", marginBottom:16
                    }}>
                      <div style={{
                        background:"var(--bg-raised)", border:"1px solid var(--border)",
                        borderRadius:"var(--r)", padding:"14px 16px"
                      }}>
                        <div style={{ fontSize:9, color:"var(--text-lo)", letterSpacing:1.5,
                          textTransform:"uppercase", fontWeight:700, marginBottom:5 }}>ML Base Price</div>
                        <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",
                          fontSize:20, fontWeight:900, color:"var(--text-md)" }}>
                          {formatINR(basePrediction)}
                        </div>
                      </div>

                      <div style={{ textAlign:"center" }}>
                        <div style={{ fontSize:18 }}>→</div>
                        <div style={{
                          fontSize:11, fontWeight:700,
                          color: result.price_adjustment_pct >= 0 ? "var(--green)" : "var(--rose)",
                          fontFamily:"'JetBrains Mono',monospace"
                        }}>
                          {result.price_adjustment_pct >= 0 ? "+" : ""}{result.price_adjustment_pct}%
                        </div>
                      </div>

                      <div style={{
                        background: result.price_adjustment_pct >= 0
                          ? "rgba(61,219,165,0.06)" : "rgba(255,107,138,0.06)",
                        border:`1px solid ${result.price_adjustment_pct >= 0
                          ? "rgba(61,219,165,0.25)" : "rgba(255,107,138,0.25)"}`,
                        borderRadius:"var(--r)", padding:"14px 16px"
                      }}>
                        <div style={{
                          fontSize:9, letterSpacing:1.5,
                          textTransform:"uppercase", fontWeight:700, marginBottom:5,
                          color: result.price_adjustment_pct >= 0 ? "var(--green)" : "var(--rose)"
                        }}>Adjusted Price</div>
                        <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",
                          fontSize:20, fontWeight:900,
                          color: result.price_adjustment_pct >= 0 ? "var(--green)" : "var(--rose)"
                        }}>
                          {formatINR(adjustedPrice)}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      padding:"12px 16px",
                      background:"var(--bg-raised)", borderRadius:"var(--r)",
                      border:"1px solid var(--border)",
                      fontSize:13, color:"var(--text-md)", lineHeight:1.6
                    }}>
                      <strong style={{ color:"var(--text-hi)" }}>What this means: </strong>
                      {result.price_adjustment_pct >= 5
                        ? `The property's excellent condition adds ${formatINR(Math.abs(priceDiff))} to its market value. Well-maintained properties command premium pricing.`
                        : result.price_adjustment_pct >= 0
                        ? `The property is in decent condition. Minor improvements could push the value higher.`
                        : result.price_adjustment_pct >= -5
                        ? `Some visible wear reduces the value by ${formatINR(Math.abs(priceDiff))}. Renovation could recover this loss.`
                        : `Significant condition issues reduce value by ${formatINR(Math.abs(priceDiff))}. Factor renovation costs into your offer.`
                      }
                    </div>
                  </>
                ) : (
                  <div style={{
                    padding:"20px", textAlign:"center",
                    background:"var(--bg-raised)", borderRadius:"var(--r)",
                    border:"1px solid var(--border)"
                  }}>
                    <div style={{ fontSize:32, marginBottom:10 }}>⬡</div>
                    <div style={{ fontSize:14, fontWeight:700, color:"var(--text-hi)", marginBottom:6 }}>
                      Predict a price first
                    </div>
                    <div style={{ fontSize:12, color:"var(--text-lo)" }}>
                      Go to the <strong style={{color:"var(--accent)"}}>Predict</strong> page,
                      run a prediction, then come back here to see the image-adjusted price.
                    </div>
                    <div style={{
                      marginTop:14, padding:"10px 14px",
                      background:"var(--accent-glow)",
                      border:"1px solid rgba(124,110,255,0.2)",
                      borderRadius:"var(--r)",
                      fontSize:13, color:"var(--accent)", fontWeight:700
                    }}>
                      Standalone adjustment: {result.price_adjustment_pct >= 0 ? "+" : ""}{result.price_adjustment_pct}% from visual condition
                    </div>
                  </div>
                )}
              </div>

              {/* Retry button */}
              <button onClick={reset} style={{
                width:"100%", padding:"13px",
                border:"1px solid var(--border-md)",
                borderRadius:"var(--r)",
                background:"var(--bg-raised)",
                color:"var(--text-md)",
                fontFamily:"'Cabinet Grotesk',sans-serif",
                fontSize:14, fontWeight:700,
                cursor:"pointer", transition:"all 0.2s"
              }}>
                📸 Analyse Another Photo
              </button>
            </>
          ) : (
            /* Empty state */
            <div className="empty" style={{
              background:"var(--bg-surface)",
              border:"1px solid var(--border)",
              borderRadius:"var(--r-xl)",
              minHeight:400,
            }}>
              <div style={{ fontSize:64, marginBottom:16, opacity:0.4 }}>📸</div>
              <div className="empty-title">Upload a property photo</div>
              <div className="empty-sub" style={{ maxWidth:300 }}>
                Gemini Vision AI will analyse the condition and estimate
                how it affects the property price
              </div>

              {/* Feature preview chips */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:24, justifyContent:"center" }}>
                {[
                  "🔬 Condition Score",
                  "💰 Price Adjustment",
                  "✅ Positive Factors",
                  "⚠ Negative Factors",
                  "👁 AI Observations",
                ].map(c => (
                  <span key={c} style={{
                    fontSize:11, fontWeight:600,
                    color:"var(--text-lo)",
                    background:"var(--bg-raised)",
                    border:"1px solid var(--border)",
                    borderRadius:20, padding:"5px 12px"
                  }}>{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
