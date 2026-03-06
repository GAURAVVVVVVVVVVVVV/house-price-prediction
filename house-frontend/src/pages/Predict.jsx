import { useState, useEffect } from "react";
import { getOptions, predictPrice } from "../utils/api";
import PriceCard      from "../components/PriceCard";
import TrendChart     from "../components/TrendChart";
import EMICalculator  from "../components/EMICalculator";
import ShapExplainer  from "../components/ShapExplainer";
import PDFReport      from "../components/PDFReport";

const DEFAULT = {
  city:"Bangalore", locality_tier:"Mid", bhk:2, bathrooms:2,
  super_area_sqft:1200, carpet_area_sqft:1000,
  floor_no:3, total_floors:10, property_age_years:3,
  parking:1, furnishing:"Semi-Furnished", lift:1, gated_society:1,
  distance_to_metro_km:2.0, distance_to_city_center_km:5.0,
  nearby_school_km:1.5, nearby_hospital_km:2.0, crime_rate_index:35,
};

function SliderRow({ label, value, min, max, step=1, onChange, unit="", colorFn }) {
  const color = colorFn ? colorFn(value) : "var(--gold)";
  return (
    <div className="field">
      <label className="label">
        {label}
        <span className="label-val" style={{ color }}>{value}{unit}</span>
      </label>
      <input className="slider" type="range" min={min} max={max} step={step}
        value={value} style={{ accentColor: color }}
        onChange={e => onChange(+e.target.value)}/>
    </div>
  );
}

function ToggleRow({ label, value, onChange }) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      <div className="toggle-wrap">
        <button className={`toggle-btn ${value===1?"on":""}`} onClick={() => onChange(1)}>✓ Yes</button>
        <button className={`toggle-btn ${value===0?"on":""}`}
          style={value===0?{borderColor:"rgba(255,107,138,0.4)",background:"rgba(255,107,138,0.08)",color:"var(--rose)"}:{}}
          onClick={() => onChange(0)}>✗ No</button>
      </div>
    </div>
  );
}

function ChipRow({ label, options, value, onChange, activeClass="chip-accent" }) {
  return (
    <div className="field">
      <label className="label">{label}</label>
      <div className="chips">
        {options.map(o => (
          <button key={o} className={`chip ${value===o||value===+o ? activeClass : ""}`}
            onClick={() => onChange(typeof o==="number" ? o : o)}>
            {o}{typeof o==="number" && label.toLowerCase().includes("bhk") ? " BHK" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

// onPrediction callback passed from App.jsx to feed ChatBot context
export default function Predict({ onPrediction }) {
  const [opts, setOpts]       = useState({ cities:[], furnishings:[], locality_tiers:[] });
  const [form, setForm]       = useState(DEFAULT);
  const [tab, setTab]         = useState("basic");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  useEffect(() => { getOptions().then(setOpts).catch(()=>{}); }, []);

  const buildPayload = () => ({
    city: form.city, locality_tier: form.locality_tier,
    bhk: +form.bhk, bathrooms: +form.bathrooms,
    super_area_sqft: +form.super_area_sqft,
    carpet_area_sqft: +form.carpet_area_sqft,
    floor_no: +form.floor_no, total_floors: +form.total_floors,
    property_age_years: +form.property_age_years,
    parking: +form.parking, furnishing: form.furnishing,
    lift: +form.lift, gated_society: +form.gated_society,
    distance_to_metro_km: +form.distance_to_metro_km,
    distance_to_city_center_km: +form.distance_to_city_center_km,
    nearby_school_km: +form.nearby_school_km,
    nearby_hospital_km: +form.nearby_hospital_km,
    crime_rate_index: +form.crime_rate_index,
  });

  const handlePredict = async () => {
    if (!form.super_area_sqft || form.super_area_sqft <= 0) {
      setError("Please enter a valid super area."); return;
    }
    setError(""); setLoading(true); setResult(null);
    try {
      const payload = buildPayload();
      const data    = await predictPrice(payload);
      setResult(data);
      // ← Feed context to global ChatBot via App.jsx
      onPrediction?.(data, payload);
    } catch {
      setError("Backend not reachable. Make sure uvicorn app:app --reload is running.");
    }
    setLoading(false);
  };

  const cities     = opts.cities.length     ? opts.cities     : ["Bangalore","Hyderabad","Mumbai","Nagpur","Pune"];
  const furnishing = opts.furnishings.length ? opts.furnishings: ["Fully-Furnished","Semi-Furnished","Unfurnished"];
  const tiers      = opts.locality_tiers.length ? opts.locality_tiers : ["Premium","Mid","Budget"];

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow">⬡ AI Valuation</div>
        <div className="page-title">Predict <span>Property Price</span></div>
        <div className="page-sub">18 features · XGBoost R²=0.984 · SHAP · PDF Export · AI Chat</div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"400px 1fr", gap:28, alignItems:"start" }}>

        {/* ── FORM ── */}
        <div className="card" style={{ position:"sticky", top:24 }}>
          <div className="card-label">Property Details</div>
          {error && <div className="err">⚠ {error}</div>}

          <div className="tab-bar">
            {[["basic","🏠 Basic"],["location","📍 Location"],["details","🔧 Details"]].map(([id,lbl]) => (
              <button key={id} className={`tab-btn ${tab===id?"active":""}`}
                onClick={() => setTab(id)}>{lbl}</button>
            ))}
          </div>

          {tab === "basic" && <>
            <div className="field">
              <label className="label">City</label>
              <select className="select-el" value={form.city} onChange={e => set("city",e.target.value)}>
                {cities.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <ChipRow label="Locality Tier" options={tiers} value={form.locality_tier}
              onChange={v => set("locality_tier",v)} activeClass="chip-gold"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div className="field">
                <label className="label">Super Area (sqft)</label>
                <input className="input" type="number" value={form.super_area_sqft}
                  onChange={e => set("super_area_sqft",+e.target.value)}/>
              </div>
              <div className="field">
                <label className="label">Carpet Area (sqft)</label>
                <input className="input" type="number" value={form.carpet_area_sqft}
                  onChange={e => set("carpet_area_sqft",+e.target.value)}/>
              </div>
            </div>
            <ChipRow label="BHK" options={[1,2,3,4,5]} value={form.bhk} onChange={v => set("bhk",v)}/>
            <ChipRow label="Bathrooms" options={[1,2,3,4,5]} value={form.bathrooms}
              onChange={v => set("bathrooms",v)} activeClass="chip-teal"/>
            <div className="field">
              <label className="label">Furnishing</label>
              <div className="chips">
                {furnishing.map(f => (
                  <button key={f} className={`chip ${form.furnishing===f?"chip-accent":""}`}
                    style={{fontSize:12}} onClick={() => set("furnishing",f)}>
                    {f==="Fully-Furnished"?"🛋 Furnished":f==="Semi-Furnished"?"🪑 Semi":"📦 Bare"}
                  </button>
                ))}
              </div>
            </div>
            <ChipRow label="Parking" options={[0,1,2,3]} value={form.parking}
              onChange={v => set("parking",v)} activeClass="chip-gold"/>
          </>}

          {tab === "location" && <>
            <div style={{background:"var(--accent-glow)",border:"1px solid rgba(124,110,255,0.15)",
              borderRadius:"var(--r)",padding:"12px 14px",marginBottom:20,fontSize:12,
              color:"var(--text-md)",lineHeight:1.5}}>
              📍 Location features are among the <strong style={{color:"var(--text-hi)"}}>most important</strong> for accurate pricing.
            </div>
            <SliderRow label="Distance to Metro" unit=" km" value={form.distance_to_metro_km}
              min={0.1} max={20} step={0.1} onChange={v => set("distance_to_metro_km",v)}
              colorFn={v => v<2?"var(--green)":v<5?"var(--gold)":"var(--rose)"}/>
            <SliderRow label="Distance to City Center" unit=" km" value={form.distance_to_city_center_km}
              min={0.5} max={40} step={0.5} onChange={v => set("distance_to_city_center_km",v)}/>
            <SliderRow label="Nearest School" unit=" km" value={form.nearby_school_km}
              min={0.1} max={10} step={0.1} onChange={v => set("nearby_school_km",v)}
              colorFn={v => v<1?"var(--green)":v<3?"var(--gold)":"var(--rose)"}/>
            <SliderRow label="Nearest Hospital" unit=" km" value={form.nearby_hospital_km}
              min={0.1} max={15} step={0.1} onChange={v => set("nearby_hospital_km",v)}
              colorFn={v => v<2?"var(--green)":v<5?"var(--gold)":"var(--rose)"}/>
            <SliderRow label="Crime Rate Index" value={form.crime_rate_index}
              min={1} max={100} step={1} onChange={v => set("crime_rate_index",v)}
              colorFn={v => v<30?"var(--green)":v<60?"var(--gold)":"var(--rose)"}/>
            <div style={{fontSize:11,color:"var(--text-lo)",marginTop:-14,marginBottom:14}}>
              {form.crime_rate_index<30?"✅ Very safe":form.crime_rate_index<60?"⚠️ Moderate":"🔴 High crime"}
            </div>
          </>}

          {tab === "details" && <>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div className="field">
                <label className="label">Floor No.</label>
                <input className="input" type="number" min={0} value={form.floor_no}
                  onChange={e => set("floor_no",+e.target.value)}/>
              </div>
              <div className="field">
                <label className="label">Total Floors</label>
                <input className="input" type="number" min={1} value={form.total_floors}
                  onChange={e => set("total_floors",+e.target.value)}/>
              </div>
            </div>
            <SliderRow label="Property Age" unit=" yrs" value={form.property_age_years}
              min={0} max={50} step={1} onChange={v => set("property_age_years",v)}
              colorFn={v => v<=2?"var(--teal)":v<=10?"var(--green)":v<=25?"var(--gold)":"var(--rose)"}/>
            <div style={{fontSize:11,color:"var(--text-lo)",marginTop:-14,marginBottom:14}}>
              {form.property_age_years<=2?"✨ Brand new":form.property_age_years<=10?"🟢 Relatively new":form.property_age_years<=25?"🟡 Mid-age":"🔴 Old property"}
            </div>
            <ToggleRow label="🛗 Lift Available"  value={form.lift}          onChange={v=>set("lift",v)}/>
            <ToggleRow label="🔒 Gated Society"   value={form.gated_society} onChange={v=>set("gated_society",v)}/>
          </>}

          <div style={{marginTop:24}}>
            <button className="btn-predict" onClick={handlePredict} disabled={loading}>
              {loading ? <><span className="spin"/>Analysing...</> : "✦  Predict Price"}
            </button>
          </div>
        </div>

        {/* ── RESULTS ── */}
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          {result ? (
            <>
              <PriceCard result={result} form={form}/>
              <div className="mini-grid anim-up delay-1">
                {[
                  {val:`${form.bhk} BHK`,lbl:"Config"},
                  {val:`${form.super_area_sqft} sqft`,lbl:"Super Area"},
                  {val:`${form.carpet_area_sqft} sqft`,lbl:"Carpet Area"},
                  {val:`${form.floor_no}/${form.total_floors}`,lbl:"Floor"},
                  {val:`${form.property_age_years} yrs`,lbl:"Age"},
                  {val:`${form.distance_to_metro_km} km`,lbl:"To Metro"},
                ].map(s => (
                  <div key={s.lbl} className="mini-stat">
                    <div className="mini-stat-val">{s.val}</div>
                    <div className="mini-stat-lbl">{s.lbl}</div>
                  </div>
                ))}
              </div>

              {/* Chat nudge banner */}
              <div style={{
                padding:"12px 18px",
                background:"linear-gradient(135deg,rgba(124,110,255,0.08),rgba(180,77,255,0.05))",
                border:"1px solid rgba(124,110,255,0.2)",
                borderRadius:"var(--r)",
                display:"flex", alignItems:"center", gap:12, fontSize:13,
                color:"var(--text-md)"
              }}>
                <span style={{fontSize:22}}>💬</span>
                <span>
                  <strong style={{color:"var(--accent)"}}>Ask ProphetAI Advisor</strong> about this property —
                  should you buy, negotiate, invest? Click the chat button in the corner.
                </span>
              </div>

              <PDFReport      formData={buildPayload()} result={result}/>
              <ShapExplainer  formData={buildPayload()}/>
              <TrendChart     price={result.predicted_price}/>
              <EMICalculator  price={result.predicted_price}/>
            </>
          ) : (
            <div className="empty" style={{
              background:"var(--bg-surface)",
              border:"1px solid var(--border)",
              borderRadius:"var(--r-xl)"
            }}>
              <div className="empty-icon">⌂</div>
              <div className="empty-title">Ready to predict</div>
              <div className="empty-sub">Fill the form and click Predict Price</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
