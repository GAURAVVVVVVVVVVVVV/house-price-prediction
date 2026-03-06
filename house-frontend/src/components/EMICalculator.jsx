import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

function formatINR(v) {
  if (!v) return "₹0";
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)} L`;
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

function calcEMI(p, rPct, yrs) {
  const r = rPct / 12 / 100;
  const n = yrs * 12;
  if (r === 0) return p / n;
  return (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

const PieTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="tip">
      <div className="tip-label">{payload[0].name}</div>
      <div className="tip-val">{formatINR(payload[0].value)}</div>
    </div>
  );
};

export default function EMICalculator({ price }) {
  const [down,    setDown]    = useState(20);
  const [rate,    setRate]    = useState(8.5);
  const [years,   setYears]   = useState(20);

  if (!price) return null;

  const loan     = price * (1 - down / 100);
  const emi      = calcEMI(loan, rate, years);
  const total    = emi * years * 12;
  const interest = total - loan;

  const pieData = [
    { name: "Principal",  value: Math.round(loan) },
    { name: "Interest",   value: Math.round(interest) },
  ];

  return (
    <div className="card anim-up delay-3">
      <div className="card-label">EMI Calculator</div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>

        {/* Down payment slider */}
        <div className="field" style={{ marginBottom:0 }}>
          <label className="label">
            Down Payment
            <span className="label-val">{down}%</span>
          </label>
          <input className="slider" type="range" min={5} max={80} value={down}
            onChange={e => setDown(+e.target.value)}/>
          <div style={{ fontSize:11, color:"var(--text-lo)", marginTop:4 }}>
            {formatINR(price * down / 100)}
          </div>
        </div>

        {/* Interest rate */}
        <div className="field" style={{ marginBottom:0 }}>
          <label className="label">
            Interest Rate
            <span className="label-val">{rate}%</span>
          </label>
          <input className="slider" type="range" min={6} max={15} step={0.1} value={rate}
            onChange={e => setRate(+e.target.value)}/>
          <div style={{ fontSize:11, color:"var(--text-lo)", marginTop:4 }}>
            p.a. (floating)
          </div>
        </div>
      </div>

      {/* Tenure chips */}
      <div className="field">
        <label className="label">Loan Tenure</label>
        <div className="chips">
          {[5,10,15,20,25,30].map(y => (
            <button key={y} className={`chip ${years===y ? "chip-accent" : ""}`}
              onClick={() => setYears(y)}>{y}yr</button>
          ))}
        </div>
      </div>

      {/* Result */}
      <div style={{
        display:"grid", gridTemplateColumns:"1fr 180px", gap:20,
        marginTop:8, alignItems:"center"
      }}>
        <div>
          {/* Big EMI */}
          <div style={{
            background:"var(--accent-glow)", border:"1px solid rgba(124,110,255,0.2)",
            borderRadius:"var(--r)", padding:"16px 20px", marginBottom:12
          }}>
            <div style={{ fontSize:10, letterSpacing:2, textTransform:"uppercase",
              color:"var(--accent)", fontWeight:700, marginBottom:6 }}>Monthly EMI</div>
            <div style={{
              fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:30,
              fontWeight:900, color:"var(--text-hi)", letterSpacing:-0.5
            }}>{formatINR(emi)}</div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {[
              { lbl:"Loan Amount", val: formatINR(loan),     color:"var(--text-hi)" },
              { lbl:"Total Interest", val: formatINR(interest), color:"var(--rose)" },
              { lbl:"Total Payment", val: formatINR(total),    color:"var(--teal)" },
            ].map(s => (
              <div key={s.lbl} className="mini-stat">
                <div className="mini-stat-val" style={{ fontSize:14, color:s.color }}>{s.val}</div>
                <div className="mini-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pie */}
        <ResponsiveContainer width="100%" height={150}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={42} outerRadius={65}
              dataKey="value" strokeWidth={0}>
              <Cell fill="var(--accent)"/>
              <Cell fill="var(--rose)"/>
            </Pie>
            <Tooltip content={<PieTip/>}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
