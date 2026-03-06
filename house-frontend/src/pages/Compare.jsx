import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { compareCities } from "../utils/api";

const COLORS = {
  Mumbai:"#f5c842", Bangalore:"#7c6eff", Pune:"#2ee8cc",
  Hyderabad:"#3ddba5", Nagpur:"#ff6b8a",
};

function formatINR(v) {
  if (!v) return "—";
  if (v >= 10000000) return `₹${(v/10000000).toFixed(2)} Cr`;
  if (v >= 100000)   return `₹${(v/100000).toFixed(1)} L`;
  return `₹${v.toLocaleString("en-IN")}`;
}

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tip">
      <div className="tip-label">{label}</div>
      <div className="tip-val">{formatINR(payload[0].value)}</div>
    </div>
  );
};

export default function Compare() {
  const [form, setForm] = useState({
    bhk:2, super_area_sqft:1000, carpet_area_sqft:850,
    floor_no:3, total_floors:10, property_age_years:3,
    parking:1, bathrooms:2, furnishing:"Semi-Furnished",
    lift:1, gated_society:1, locality_tier:"Mid",
    distance_to_metro_km:2.0, distance_to_city_center_km:5.0,
    nearby_school_km:1.5, nearby_hospital_km:2.0, crime_rate_index:35,
  });
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCompare = async () => {
    setLoading(true); setError(""); setData([]);
    try {
      const res = await compareCities(form);
      setData(res.comparisons || []);
    } catch {
      setError("Backend not reachable. Make sure uvicorn is running.");
    }
    setLoading(false);
  };

  const max = data.length ? Math.max(...data.map(d => d.price)) : 1;
  const min = data.length ? Math.min(...data.map(d => d.price)) : 0;

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow">◈ Multi-City</div>
        <div className="page-title">City <span>Comparison</span></div>
        <div className="page-sub">Same property — different cities. See where your money goes furthest.</div>
      </div>

      {/* Config card */}
      <div className="card" style={{ marginBottom:28 }}>
        <div className="card-label">Property Configuration</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:16 }}>
          <div className="field" style={{ marginBottom:0 }}>
            <label className="label">BHK</label>
            <select className="select-el" value={form.bhk} onChange={e => set("bhk", +e.target.value)}>
              {[1,2,3,4,5].map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom:0 }}>
            <label className="label">Super Area (sqft)</label>
            <input className="input" type="number" value={form.super_area_sqft}
              onChange={e => set("super_area_sqft", +e.target.value)}/>
          </div>
          <div className="field" style={{ marginBottom:0 }}>
            <label className="label">Locality Tier</label>
            <select className="select-el" value={form.locality_tier} onChange={e => set("locality_tier", e.target.value)}>
              {["Premium","Mid","Budget"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom:0 }}>
            <label className="label">Furnishing</label>
            <select className="select-el" value={form.furnishing} onChange={e => set("furnishing", e.target.value)}>
              {["Fully-Furnished","Semi-Furnished","Unfurnished"].map(f => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>
        {error && <div className="err" style={{ marginBottom:12 }}>⚠ {error}</div>}
        <button className="btn-compare" onClick={handleCompare} disabled={loading}>
          {loading ? <><span className="spin" style={{ borderTopColor:"#0a0810" }}/>Comparing...</> : "◈  Compare All Cities"}
        </button>
      </div>

      {data.length > 0 && (
        <>
          {/* Bar chart */}
          <div className="card anim-up" style={{ marginBottom:24 }}>
            <div className="card-label">Price Across Cities</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data} margin={{ top:8, right:16, bottom:0, left:8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
                <XAxis dataKey="city" axisLine={false} tickLine={false}
                  tick={{ fill:"rgba(240,238,255,0.45)", fontSize:12 }}/>
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill:"rgba(240,238,255,0.35)", fontSize:11 }}
                  tickFormatter={v => `₹${(v/100000).toFixed(0)}L`}/>
                <Tooltip content={<ChartTip/>}/>
                <Bar dataKey="price" radius={[10,10,0,0]} maxBarSize={80}>
                  {data.map(d => <Cell key={d.city} fill={COLORS[d.city]||"#7c6eff"}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* City cards grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:14 }}>
            {data.map((d, i) => {
              const pct     = ((d.price - min) / (max - min)) * 100;
              const color   = COLORS[d.city] || "#7c6eff";
              const isBest  = d.price === min;
              const isWorst = d.price === max;
              return (
                <div key={d.city} className="card anim-up" style={{
                  animationDelay:`${i*0.06}s`, padding:20,
                  borderColor: isBest  ? "rgba(61,219,165,0.3)"
                             : isWorst ? "rgba(245,200,66,0.3)"
                             : "var(--border)"
                }}>
                  {isBest  && <div style={pillStyle("var(--green)")}>Best Value</div>}
                  {isWorst && <div style={pillStyle("var(--gold)")}>Most Exp.</div>}

                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                    <div style={{
                      width:34, height:34, borderRadius:9,
                      background:`rgba(${hexRgb(color)},0.14)`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:16, color
                    }}>🏙</div>
                    <div>
                      <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:14 }}>{d.city}</div>
                      <div style={{ fontSize:10, color:"var(--text-lo)" }}>Rank #{i+1}</div>
                    </div>
                  </div>

                  <div style={{
                    fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:22,
                    fontWeight:900, color, marginBottom:10
                  }}>{formatINR(d.price)}</div>

                  <div style={{ height:3, background:"rgba(255,255,255,0.06)", borderRadius:3, marginBottom:8 }}>
                    <div style={{
                      height:"100%", borderRadius:3, background:color,
                      width:`${pct}%`, transition:"width 1s ease"
                    }}/>
                  </div>
                  <div style={{ fontSize:11, color:"var(--text-lo)" }}>
                    ₹{Math.round(d.price / form.super_area_sqft).toLocaleString("en-IN")}/sqft
                  </div>
                </div>
              );
            })}
          </div>

          {/* Savings callout */}
          <div className="card anim-up" style={{ marginTop:24, borderColor:"rgba(61,219,165,0.2)", padding:"20px 24px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ fontSize:40 }}>💡</div>
              <div>
                <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:17, marginBottom:4 }}>
                  Choosing {data[data.length-1]?.city} over {data[0]?.city} saves you{" "}
                  <span style={{ color:"var(--green)" }}>
                    {formatINR(data[0]?.price - data[data.length-1]?.price)}
                  </span>
                </div>
                <div style={{ fontSize:13, color:"var(--text-md)" }}>
                  For {form.super_area_sqft} sqft · {form.bhk} BHK · {form.locality_tier} locality · {form.furnishing}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!data.length && !loading && (
        <div className="empty" style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--r-xl)" }}>
          <div className="empty-icon">◈</div>
          <div className="empty-title">Set config and compare</div>
          <div className="empty-sub">See how the same property is priced across all 5 cities</div>
        </div>
      )}
    </div>
  );
}

function pillStyle(color) {
  return {
    display:"inline-block", fontSize:9, fontWeight:800,
    letterSpacing:1.5, textTransform:"uppercase", color,
    background:`rgba(${hexRgb(color)},0.1)`,
    border:`1px solid rgba(${hexRgb(color)},0.3)`,
    borderRadius:20, padding:"3px 8px", marginBottom:10
  };
}

function hexRgb(hex) {
  try {
    return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
  } catch { return "255,255,255"; }
}
