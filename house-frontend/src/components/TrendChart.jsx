import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot
} from "recharts";

function buildTrend(price) {
  const weights = [0.52, 0.59, 0.66, 0.74, 0.84, 0.93, 1.0, 1.11];
  return ["2019","2020","2021","2022","2023","2024","2025","2026"].map((yr, i) => ({
    year: yr,
    price: Math.round((price * weights[i]) / 100000),
    future: i >= 6,
  }));
}

const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tip">
      <div className="tip-label">{label}</div>
      <div className="tip-val">₹{payload[0].value.toFixed(1)} L</div>
    </div>
  );
};

export default function TrendChart({ price }) {
  if (!price) return null;
  const data = buildTrend(price);

  return (
    <div className="card anim-up delay-2">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <div className="card-label">Price Trend</div>
          <div style={{ fontSize:15, fontWeight:600, color:"var(--text-hi)" }}>2019 – 2026</div>
        </div>
        <div style={{ display:"flex", gap:16, fontSize:11, color:"var(--text-lo)" }}>
          <span style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:16, height:2, background:"var(--accent)", display:"inline-block", borderRadius:2 }}/>
            Historical
          </span>
          <span style={{ display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:16, height:2, borderTop:"2px dashed var(--gold)", display:"inline-block" }}/>
            Projected
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top:8, right:8, bottom:0, left:0 }}>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#7c6eff" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#7c6eff" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#f5c842" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#f5c842" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}/>
          <XAxis dataKey="year" axisLine={false} tickLine={false}
            tick={{ fill:"rgba(240,238,255,0.35)", fontSize:11, fontFamily:"JetBrains Mono" }}/>
          <YAxis axisLine={false} tickLine={false}
            tick={{ fill:"rgba(240,238,255,0.35)", fontSize:10 }}
            tickFormatter={v => `₹${v}L`}/>
          <Tooltip content={<ChartTip/>}/>
          <ReferenceLine x="2025" stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4"
            label={{ value:"Now", fill:"rgba(255,255,255,0.25)", fontSize:10, position:"insideTopRight" }}/>
          <Area type="monotone" dataKey="price" stroke="var(--accent)" strokeWidth={2.5}
            fill="url(#grad)"
            dot={({ cx, cy, payload }) => (
              <circle key={payload.year} cx={cx} cy={cy} r={4}
                fill={payload.future ? "var(--gold)" : "var(--accent)"}
                stroke="var(--bg-base)" strokeWidth={2}/>
            )}/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
