import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { getMetadata } from "../utils/api";

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

const FeatTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tip">
      <div className="tip-label">{label}</div>
      <div className="tip-val">{(payload[0].value * 100).toFixed(1)}%</div>
    </div>
  );
};

export default function Dashboard() {
  const [meta, setMeta]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    getMetadata()
      .then(setMeta)
      .catch(() => setError("Cannot reach backend. Make sure uvicorn is running."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page">
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:400, gap:14 }}>
        <div className="spin" style={{ width:28, height:28, borderWidth:3 }}/>
        <span style={{ color:"var(--text-md)" }}>Loading model data...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="page">
      <div className="err" style={{ maxWidth:500 }}>⚠ {error}</div>
    </div>
  );

  const stats = meta.model_stats || {};

  // Feature importance — top 10, clean names
  const featData = Object.entries(meta.feature_importances || {})
    .slice(0, 10)
    .map(([k, v]) => ({
      name: k
        .replace("Super_Area_sqft","Super Area")
        .replace("Carpet_Area_sqft","Carpet Area")
        .replace("city_median","City Median")
        .replace("Property_Age_years","Prop. Age")
        .replace("Distance_to_Metro_km","Metro Dist.")
        .replace("Distance_to_CityCenter_km","City Dist.")
        .replace("Proximity_Score","Proximity")
        .replace("Floor_Ratio","Floor Ratio")
        .replace("Area_Efficiency","Area Eff.")
        .replace("Furnishing_enc","Furnishing")
        .replace("Locality_enc","Locality")
        .replace("Crime_Rate_Index","Crime Rate")
        .replace("Is_Premium","Is Premium")
        .replace("Is_Budget","Is Budget")
        .replace("Rooms_per_100sqft","Rooms/100sqft")
        .replace("Services_Score","Services")
        .replace("Safety_Score","Safety")
        .replace("City_enc","City"),
      value: v,
    }));

  // City median prices
  const cityData = Object.entries(meta.city_stats || {})
    .map(([city, s]) => ({ city, price: s.city_median }))
    .sort((a, b) => b.price - a.price);

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow">◉ Analytics</div>
        <div className="page-title">Model <span>Dashboard</span></div>
        <div className="page-sub">XGBoost performance · Trained on real Kaggle Indian housing data</div>
      </div>

      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
        <KpiCard icon="◈" iconBg="rgba(124,110,255,0.15)" iconColor="var(--accent)"
          label="R² Score" val={`${(stats.r2*100).toFixed(1)}%`} valColor="var(--accent)"
          sub="Model accuracy"/>
        <KpiCard icon="⬡" iconBg="rgba(245,200,66,0.12)" iconColor="var(--gold)"
          label="Training Records" val={(stats.training_samples||0).toLocaleString()} valColor="var(--gold)"
          sub="After cleaning"/>
        <KpiCard icon="◉" iconBg="rgba(46,232,204,0.1)" iconColor="var(--teal)"
          label="Mean Abs. Error" val={formatINR(stats.mae)} valColor="var(--teal)"
          sub="Avg prediction error"/>
        <KpiCard icon="✦" iconBg="rgba(61,219,165,0.1)" iconColor="var(--green)"
          label="MAPE" val={`${stats.mape}%`} valColor="var(--green)"
          sub="% error on test set"/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:24 }}>

        {/* Feature importance */}
        <div className="card">
          <div className="card-label">Feature Importance</div>
          <div style={{ fontSize:12, color:"var(--text-md)", marginBottom:16 }}>
            Which factors most influence the predicted price
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={featData} layout="vertical"
              margin={{ top:0, right:24, bottom:0, left:90 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false}/>
              <XAxis type="number" axisLine={false} tickLine={false}
                tick={{ fill:"rgba(240,238,255,0.35)", fontSize:10 }}
                tickFormatter={v => `${(v*100).toFixed(0)}%`}/>
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false}
                tick={{ fill:"rgba(240,238,255,0.5)", fontSize:11, fontFamily:"Satoshi" }}/>
              <Tooltip content={<FeatTip/>}/>
              <Bar dataKey="value" radius={[0,6,6,0]} maxBarSize={18}>
                {featData.map((_, i) => (
                  <Cell key={i} fill={`hsl(${250 - i*18}, 85%, ${68 - i*2}%)`}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* City median prices */}
        <div className="card">
          <div className="card-label">Median Price by City</div>
          <div style={{ fontSize:12, color:"var(--text-md)", marginBottom:16 }}>
            From training data
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={cityData} margin={{ top:0, right:8, bottom:0, left:8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="city" axisLine={false} tickLine={false}
                tick={{ fill:"rgba(240,238,255,0.45)", fontSize:12 }}/>
              <YAxis axisLine={false} tickLine={false}
                tick={{ fill:"rgba(240,238,255,0.35)", fontSize:10 }}
                tickFormatter={v => `₹${(v/100000).toFixed(0)}L`}/>
              <Tooltip content={<ChartTip/>}/>
              <Bar dataKey="price" radius={[8,8,0,0]} maxBarSize={70}>
                {cityData.map(d => <Cell key={d.city} fill={COLORS[d.city]||"#7c6eff"}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model summary table */}
      <div className="card" style={{ marginBottom:24 }}>
        <div className="card-label">Model Summary</div>
        <table className="data-table">
          <thead>
            <tr>
              {["Metric","Value","Status"].map(h => <th key={h}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {[
              { metric:"Algorithm",         val:"XGBoost (Gradient Boosted Trees)", status:"—" },
              { metric:"R² Score",          val:`${(stats.r2*100).toFixed(2)}%`,   status: stats.r2>=0.9?"Excellent":stats.r2>=0.8?"Great":"Good", badge: stats.r2>=0.9?"badge-green":"badge-gold" },
              { metric:"MAE",               val:formatINR(stats.mae),              status:"Acceptable" },
              { metric:"MAPE",              val:`${stats.mape}%`,                  status: stats.mape<10?"Excellent":"Good", badge: stats.mape<10?"badge-green":"badge-gold" },
              { metric:"Training Samples",  val:(stats.training_samples||0).toLocaleString(), status:"—" },
              { metric:"Test Samples",      val:(stats.test_samples||0).toLocaleString(),     status:"—" },
              { metric:"Total Features",    val:(meta.features||[]).length,                   status:"—" },
              { metric:"Cities Covered",    val:(meta.cities||[]).join(", "),                  status:"—" },
            ].map(r => (
              <tr key={r.metric}>
                <td style={{ color:"var(--text-hi)", fontWeight:500 }}>{r.metric}</td>
                <td style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13 }}>{r.val}</td>
                <td>
                  {r.badge
                    ? <span className={`badge ${r.badge}`}>{r.status}</span>
                    : <span style={{ color:"var(--text-lo)", fontSize:12 }}>{r.status}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info note */}
      <div className="card" style={{ borderColor:"rgba(124,110,255,0.2)" }}>
        <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
          <div style={{ fontSize:32 }}>📊</div>
          <div>
            <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:16, marginBottom:6 }}>
              About This Model
            </div>
            <div style={{ fontSize:13, color:"var(--text-md)", lineHeight:1.7 }}>
              Trained on the <strong style={{color:"var(--text-hi)"}}>India House Price Prediction Dataset</strong> from Kaggle.
              Uses <strong style={{color:"var(--text-hi)"}}>28 engineered features</strong> including floor number, property age,
              furnishing status, metro distance, and crime rate — features that most public datasets lack.
              With <strong style={{color:"var(--accent)"}}>R² = {(stats.r2*100).toFixed(1)}%</strong> this model is production-grade.
              Best used for market benchmarking and relative valuations.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, iconBg, iconColor, label, val, valColor, sub }) {
  return (
    <div className="kpi">
      <div className="kpi-icon" style={{ background:iconBg, color:iconColor }}>{icon}</div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-val" style={{ color:valColor }}>{val}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}
