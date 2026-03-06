import { useState, useEffect, useRef } from "react";
import profilePhoto from "../assests/profile.jpg";
const STATS = [
  { value: "12K+",   label: "Training Records",  icon: "◈" },
  { value: "98.4%",  label: "Model Accuracy R²", icon: "⬡" },
  { value: "28",     label: "Engineered Features",icon: "✦" },
  { value: "5",      label: "Cities Covered",     icon: "◉" },
  { value: "6",      label: "AI Features Built",  icon: "⚡" },
  { value: "1",      label: "Developer",          icon: "★" },
];

const TECH_STACK = [
  {
    category: "Machine Learning",
    color: "#7c6eff",
    glow: "rgba(124,110,255,0.15)",
    items: [
      { name: "XGBoost", desc: "Primary prediction model — R²=0.984" },
      { name: "SHAP", desc: "Explainable AI — feature attribution" },
      { name: "Scikit-learn", desc: "Preprocessing, label encoding, pipelines" },
      { name: "Pandas & NumPy", desc: "Data engineering, 28 feature extraction" },
    ]
  },
  {
    category: "Backend",
    color: "#3ddba5",
    glow: "rgba(61,219,165,0.15)",
    items: [
      { name: "Python 3.11", desc: "Core language for ML and API" },
      { name: "FastAPI", desc: "High-performance REST API with async support" },
      { name: "ReportLab", desc: "PDF generation — branded valuation reports" },
      { name: "Gemini Vision AI", desc: "Image-based property condition scoring" },
    ]
  },
  {
    category: "Frontend",
    color: "#f5c842",
    glow: "rgba(245,200,66,0.15)",
    items: [
      { name: "React 18", desc: "Component-based UI with hooks" },
      { name: "JavaScript ES6+", desc: "Async/await, destructuring, modules" },
      { name: "Custom CSS", desc: "Dark theme design system with CSS variables" },
      { name: "Recharts", desc: "Interactive data visualizations" },
    ]
  },
  {
    category: "AI & APIs",
    color: "#ff6b8a",
    glow: "rgba(255,107,138,0.15)",
    items: [
      { name: "Gemini 2.0 Flash", desc: "Real estate chatbot & image analysis" },
      { name: "SHAP TreeExplainer", desc: "Per-prediction feature importance" },
      { name: "REST API", desc: "7 endpoints — predict, explain, report, chat" },
      { name: "Multimodal AI", desc: "Text + Vision combined intelligence" },
    ]
  },
];

const FEATURES = [
  { icon:"⬡", title:"Price Prediction",      desc:"XGBoost model trained on 12K Indian property records with 28 engineered features" },
  { icon:"🔬", title:"SHAP Explainability",   desc:"Every prediction explained — see exactly which features pushed price up or down" },
  { icon:"⚡", title:"What-If Analyzer",      desc:"Live sliders re-predict instantly — explore how any change affects the price" },
  { icon:"📸", title:"Vision AI Analysis",    desc:"Upload a property photo — Gemini scores condition and adjusts the price estimate" },
  { icon:"📄", title:"PDF Report Export",     desc:"2-page branded valuation report with SHAP chart, EMI table and property summary" },
  { icon:"💬", title:"AI Real Estate Advisor",desc:"Context-aware chatbot that knows your exact property and gives tailored advice" },
];

function AnimatedNumber({ target, suffix = "" }) {
  const [display, setDisplay] = useState("0");
  const ref = useRef(null);
  const observed = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !observed.current) {
        observed.current = true;
        const isFloat   = target.includes(".");
        const isPercent = target.includes("%");
        const isPlus    = target.includes("+");
        const num       = parseFloat(target.replace(/[^0-9.]/g, ""));
        let start       = 0;
        const duration  = 1200;
        const steps     = 40;
        const increment = num / steps;
        let step        = 0;
        const timer = setInterval(() => {
          step++;
          start += increment;
          if (step >= steps) {
            setDisplay(target);
            clearInterval(timer);
          } else {
            const val = isFloat ? start.toFixed(1) : Math.floor(start);
            setDisplay(`${val}${isPercent ? "%" : ""}${isPlus && step === steps - 1 ? "+" : ""}`);
          }
        }, duration / steps);
      }
    }, { threshold: 0.3 });

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{display}</span>;
}

export default function About() {
  const [profileImg, setProfileImg] = useState(profilePhoto);
  const [imgHover,   setImgHover]   = useState(false);
  const fileRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setProfileImg(url);
  };

  return (
    <div className="page" style={{ maxWidth:900, margin:"0 auto" }}>

      {/* ── HERO ── */}
      <div style={{
        position:"relative", overflow:"hidden",
        borderRadius:24, marginBottom:28,
        background:"linear-gradient(135deg, #0a0814 0%, #110d1f 50%, #0a0814 100%)",
        border:"1px solid rgba(124,110,255,0.2)",
        padding:"52px 48px",
      }}>

        {/* Background grid */}
        <div style={{
          position:"absolute", inset:0, opacity:0.04,
          backgroundImage:`
            linear-gradient(rgba(124,110,255,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(124,110,255,1) 1px, transparent 1px)
          `,
          backgroundSize:"40px 40px",
          pointerEvents:"none",
        }}/>

        {/* Glow orbs */}
        <div style={{
          position:"absolute", top:-60, right:-60,
          width:300, height:300, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(124,110,255,0.15) 0%, transparent 70%)",
          pointerEvents:"none",
        }}/>
        <div style={{
          position:"absolute", bottom:-40, left:-40,
          width:200, height:200, borderRadius:"50%",
          background:"radial-gradient(circle, rgba(61,219,165,0.1) 0%, transparent 70%)",
          pointerEvents:"none",
        }}/>

        <div style={{ position:"relative", display:"flex", gap:40, alignItems:"center", flexWrap:"wrap" }}>

          {/* ── PROFILE PHOTO ── */}
          <div style={{ flexShrink:0 }}>
            <div
              onClick={() => fileRef.current?.click()}
              onMouseEnter={() => setImgHover(true)}
              onMouseLeave={() => setImgHover(false)}
              style={{
                width:130, height:130, borderRadius:"50%",
                position:"relative", cursor:"pointer",
                transition:"transform 0.3s",
                transform: imgHover ? "scale(1.05)" : "scale(1)",
              }}>

              {/* Ring */}
              <div style={{
                position:"absolute", inset:-3, borderRadius:"50%",
                background:"linear-gradient(135deg, var(--accent), #b44dff, var(--teal))",
                padding:3,
              }}>
                <div style={{
                  width:"100%", height:"100%", borderRadius:"50%",
                  background:"#0a0814",
                }}/>
              </div>

              {/* Photo / placeholder */}
              <div style={{
                position:"absolute", inset:3, borderRadius:"50%",
                overflow:"hidden",
                background:"linear-gradient(135deg, rgba(124,110,255,0.2), rgba(61,219,165,0.1))",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                {profileImg ? (
                  <img src={profileImg} alt="Gaurav Mehta"
                    style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                ) : (
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:36 }}>👤</div>
                    <div style={{
                      fontSize:9, color:"var(--text-lo)", marginTop:4,
                      fontWeight:700, letterSpacing:0.5
                    }}>UPLOAD</div>
                  </div>
                )}
              </div>

              {/* Hover overlay */}
              {imgHover && (
                <div style={{
                  position:"absolute", inset:3, borderRadius:"50%",
                  background:"rgba(124,110,255,0.6)",
                  display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center",
                  backdropFilter:"blur(2px)",
                }}>
                  <div style={{ fontSize:22 }}>📷</div>
                  <div style={{ fontSize:9, color:"#fff", fontWeight:800, marginTop:4, letterSpacing:1 }}>
                    {profileImg ? "CHANGE" : "ADD PHOTO"}
                  </div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*"
              style={{ display:"none" }} onChange={handleImageUpload}/>

            {/* Rotating badge */}
            <div style={{
              marginTop:10, textAlign:"center",
              fontSize:10, fontWeight:800, letterSpacing:2,
              color:"var(--accent)", textTransform:"uppercase"
            }}>
              ✦ Builder
            </div>
          </div>

          {/* ── NAME & BIO ── */}
          <div style={{ flex:1, minWidth:260 }}>
            {/* Eyebrow */}
            <div style={{
              display:"inline-flex", alignItems:"center", gap:8,
              padding:"4px 14px", borderRadius:20, marginBottom:16,
              background:"rgba(124,110,255,0.1)",
              border:"1px solid rgba(124,110,255,0.25)",
              fontSize:11, fontWeight:800, letterSpacing:2,
              color:"var(--accent)", textTransform:"uppercase",
            }}>
              <span style={{
                width:6, height:6, borderRadius:"50%",
                background:"var(--green)",
                animation:"blink 2s infinite"
              }}/>
              Developer & ML Engineer
            </div>

            <h1 style={{
              fontFamily:"'Cabinet Grotesk', sans-serif",
              fontSize:48, fontWeight:900, lineHeight:1.0,
              margin:"0 0 16px",
              background:"linear-gradient(135deg, #ffffff 0%, rgba(124,110,255,0.9) 100%)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            }}>
              Gaurav<br/>Mehta
            </h1>

            <p style={{
              fontSize:15, color:"var(--text-md)", lineHeight:1.7,
              margin:"0 0 24px", maxWidth:480,
            }}>
              Built <strong style={{color:"var(--text-hi)"}}>ProphetAI</strong> a full-stack AI property
              valuation platform combining <strong style={{color:"var(--accent)"}}>XGBoost ML</strong>,{" "}
              <strong style={{color:"var(--teal)"}}>SHAP explainability</strong>,{" "}
              <strong style={{color:"var(--gold)"}}>Gemini Vision AI</strong>, and{" "}
              <strong style={{color:"var(--rose)"}}>real-time prediction</strong> entirely from scratch.
            </p>

            {/* Social links */}
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {[
                { href:"https://github.com/GAURAVVVVVVVVVVVVV", label:"GitHub", icon:"⌥", color:"#ffffff" },
                { href:"https://www.linkedin.com/in/gaurav-mehta-324431318/", label:"LinkedIn", icon:"◈", color:"#0a66c2" },
                { href:"https://www.instagram.com/gauravvmehtaaa", label:"Instagram", icon:"◉", color:"#e1306c" },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  style={{
                    display:"inline-flex", alignItems:"center", gap:8,
                    padding:"9px 18px", borderRadius:"var(--r)",
                    background:"rgba(255,255,255,0.05)",
                    border:"1px solid rgba(255,255,255,0.1)",
                    color:"var(--text-hi)", fontSize:13, fontWeight:700,
                    textDecoration:"none", transition:"all 0.2s",
                    fontFamily:"'Satoshi', sans-serif",
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = `${s.color}18`;
                    e.currentTarget.style.borderColor = `${s.color}60`;
                    e.currentTarget.style.color = s.color;
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.color = "var(--text-hi)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}>
                  <span style={{ fontSize:16 }}>{s.icon}</span>
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div style={{
        display:"grid", gridTemplateColumns:"repeat(6,1fr)",
        gap:12, marginBottom:28,
      }}>
        {STATS.map((s, i) => (
          <div key={s.label} className="card" style={{
            textAlign:"center", padding:"18px 10px",
            borderColor:"rgba(124,110,255,0.15)",
            animation:`fadeUp 0.5s ease ${i*0.08}s both`,
          }}>
            <div style={{ fontSize:18, marginBottom:6, opacity:0.7 }}>{s.icon}</div>
            <div style={{
              fontFamily:"'Cabinet Grotesk',sans-serif",
              fontSize:22, fontWeight:900,
              color:"var(--accent)", lineHeight:1,
            }}>
              <AnimatedNumber target={s.value}/>
            </div>
            <div style={{ fontSize:10, color:"var(--text-lo)", marginTop:5,
              fontWeight:700, letterSpacing:0.5, lineHeight:1.3 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── ABOUT THIS PROJECT ── */}
      <div className="card" style={{
        marginBottom:28,
        borderColor:"rgba(61,219,165,0.2)",
        background:"linear-gradient(135deg,rgba(61,219,165,0.03),transparent)"
      }}>
        <div className="card-label">⬡ About This Project</div>
        <p style={{ fontSize:15, color:"var(--text-md)", lineHeight:1.8, margin:"0 0 16px" }}>
          ProphetAI is a <strong style={{color:"var(--text-hi)"}}>production-grade AI property valuation platform</strong> built
          entirely by Gaurav Mehta. The project goes far beyond a standard ML model — it's a complete
          full-stack application combining machine learning, explainable AI, computer vision,
          and a conversational AI advisor into one cohesive product.
        </p>
        <p style={{ fontSize:15, color:"var(--text-md)", lineHeight:1.8, margin:"0 0 16px" }}>
          The <strong style={{color:"var(--accent)"}}>XGBoost model</strong> was trained on 12,000+ Indian housing records
          across 5 major cities, achieving an R² of <strong style={{color:"var(--green)"}}>0.9841</strong> — meaning it
          explains 98.4% of price variance. Feature engineering produced 28 inputs from 18 raw features,
          capturing proximity scores, area efficiency, safety indices and more.
        </p>
        <p style={{ fontSize:15, color:"var(--text-md)", lineHeight:1.8, margin:0 }}>
          What makes this project unique is the <strong style={{color:"var(--gold)"}}>depth of AI integration</strong> —
          SHAP explanations show why every prediction was made, Gemini Vision analyses property photos,
          a What-If Analyzer lets users explore price sensitivity in real time, and an AI chatbot
          gives context-aware real estate advice. Every feature was designed, coded and shipped by one developer.
        </p>
      </div>

      {/* ── FEATURES BUILT ── */}
      <div className="card" style={{ marginBottom:28 }}>
        <div className="card-label">⚡ Features Built</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} style={{
              display:"flex", gap:14, alignItems:"flex-start",
              padding:"14px 16px",
              background:"var(--bg-raised)",
              border:"1px solid var(--border)",
              borderRadius:"var(--r)",
              transition:"all 0.2s",
              animation:`fadeUp 0.4s ease ${i*0.07}s both`,
              cursor:"default",
            }}
            onMouseOver={e => {
              e.currentTarget.style.borderColor = "rgba(124,110,255,0.3)";
              e.currentTarget.style.background  = "rgba(124,110,255,0.05)";
              e.currentTarget.style.transform   = "translateY(-2px)";
            }}
            onMouseOut={e => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.background  = "var(--bg-raised)";
              e.currentTarget.style.transform   = "translateY(0)";
            }}>
              <div style={{
                width:38, height:38, borderRadius:10, flexShrink:0,
                background:"var(--accent-glow)",
                border:"1px solid rgba(124,110,255,0.2)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:18,
              }}>{f.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:800,
                  color:"var(--text-hi)", marginBottom:4 }}>{f.title}</div>
                <div style={{ fontSize:12, color:"var(--text-lo)", lineHeight:1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TECH STACK ── */}
      <div className="card" style={{ marginBottom:28 }}>
        <div className="card-label">🛠 Tech Stack</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          {TECH_STACK.map(cat => (
            <div key={cat.category} style={{
              background:"var(--bg-raised)",
              border:`1px solid ${cat.color}30`,
              borderRadius:"var(--r-lg)", padding:"16px",
            }}>
              <div style={{
                fontSize:10, fontWeight:800, letterSpacing:2,
                color: cat.color, textTransform:"uppercase",
                marginBottom:14,
                display:"flex", alignItems:"center", gap:8,
              }}>
                <div style={{
                  width:6, height:6, borderRadius:"50%",
                  background: cat.color,
                  boxShadow:`0 0 8px ${cat.color}`
                }}/>
                {cat.category}
              </div>
              {cat.items.map(item => (
                <div key={item.name} style={{
                  display:"flex", justifyContent:"space-between",
                  alignItems:"flex-start", gap:8, marginBottom:10,
                  paddingBottom:10,
                  borderBottom:"1px solid var(--border)",
                }}>
                  <span style={{
                    fontSize:13, fontWeight:800,
                    color:"var(--text-hi)", flexShrink:0
                  }}>{item.name}</span>
                  <span style={{
                    fontSize:11, color:"var(--text-lo)",
                    textAlign:"right", lineHeight:1.4
                  }}>{item.desc}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── DEVELOPMENT JOURNEY ── */}
      <div className="card" style={{ marginBottom:28, borderColor:"rgba(245,200,66,0.15)" }}>
        <div className="card-label">🗺 Development Journey</div>
        <div style={{ position:"relative", paddingLeft:28 }}>

          {/* Vertical line */}
          <div style={{
            position:"absolute", left:7, top:8, bottom:8,
            width:2, background:"linear-gradient(to bottom, var(--accent), var(--teal))",
            borderRadius:2,
          }}/>

          {[
            { step:"01", title:"Data Engineering",      color:"var(--accent)", desc:"Collected and cleaned 12K+ Indian housing records. Engineered 28 features including proximity scores, floor ratios, safety indices." },
            { step:"02", title:"Model Training",         color:"var(--teal)",   desc:"Trained XGBoost with hyperparameter tuning. Achieved R²=0.9841. Applied log transformation to handle price skewness." },
            { step:"03", title:"Backend API",            color:"var(--gold)",   desc:"Built 7-endpoint FastAPI backend with SHAP explainer, PDF generation via ReportLab, and Gemini Vision integration." },
            { step:"04", title:"React Frontend",         color:"var(--rose)",   desc:"Built complete dark-theme UI from scratch — custom design system, CSS variables, animated components, responsive layout." },
            { step:"05", title:"AI Feature Integration", color:"var(--accent)", desc:"Integrated SHAP waterfall charts, What-If Analyzer, AI chatbot, Vision AI image scoring, and PDF export." },
          ].map((item, i) => (
            <div key={item.step} style={{
              display:"flex", gap:20, marginBottom:20,
              animation:`fadeUp 0.4s ease ${i*0.1}s both`,
            }}>
              {/* Dot */}
              <div style={{
                width:16, height:16, borderRadius:"50%", flexShrink:0,
                background: item.color,
                border:`2px solid var(--bg-surface)`,
                marginTop:3, marginLeft:-7,
                boxShadow:`0 0 12px ${item.color}60`,
              }}/>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                  <span style={{
                    fontSize:9, fontWeight:900, letterSpacing:2,
                    color: item.color, fontFamily:"'JetBrains Mono',monospace"
                  }}>PHASE {item.step}</span>
                  <span style={{ fontSize:14, fontWeight:800, color:"var(--text-hi)" }}>
                    {item.title}
                  </span>
                </div>
                <p style={{ fontSize:13, color:"var(--text-lo)", lineHeight:1.6, margin:0 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOOTER CTA ── */}
      <div style={{
        borderRadius:20, overflow:"hidden", position:"relative",
        background:"linear-gradient(135deg, #0f0b1e 0%, #160d2a 100%)",
        border:"1px solid rgba(124,110,255,0.25)",
        padding:"40px 48px", textAlign:"center",
      }}>
        <div style={{
          position:"absolute", inset:0, opacity:0.05,
          backgroundImage:`radial-gradient(rgba(124,110,255,1) 1px, transparent 1px)`,
          backgroundSize:"24px 24px", pointerEvents:"none",
        }}/>
        <div style={{ position:"relative" }}>
          <div style={{
            fontSize:11, fontWeight:800, letterSpacing:3,
            color:"var(--accent)", textTransform:"uppercase", marginBottom:12
          }}>Built with passion by</div>
          <div style={{
            fontFamily:"'Cabinet Grotesk',sans-serif",
            fontSize:40, fontWeight:900,
            background:"linear-gradient(135deg,#fff,rgba(124,110,255,0.8))",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            marginBottom:12,
          }}>Gaurav Mehta</div>
          <div style={{ fontSize:14, color:"var(--text-lo)", marginBottom:28, lineHeight:1.6 }}>
            Every line of code, every model weight, every UI component —<br/>
            designed, built and shipped by one developer.
          </div>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            {[
              { href:"https://github.com/GAURAVVVVVVVVVVVVV",             label:"View on GitHub",   color:"#fff" },
              { href:"https://www.linkedin.com/in/gaurav-mehta-324431318/",label:"Connect on LinkedIn",color:"#0a66c2" },
              { href:"https://www.instagram.com/gauravvmehtaaa",           label:"Follow on Instagram",color:"#e1306c" },
            ].map(btn => (
              <a key={btn.label} href={btn.href} target="_blank" rel="noopener noreferrer"
                style={{
                  padding:"12px 24px", borderRadius:"var(--r)",
                  background:"rgba(255,255,255,0.06)",
                  border:"1px solid rgba(255,255,255,0.12)",
                  color:"var(--text-hi)", fontSize:13, fontWeight:700,
                  textDecoration:"none", transition:"all 0.2s",
                  fontFamily:"'Satoshi',sans-serif",
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = `${btn.color}18`;
                  e.currentTarget.style.borderColor = `${btn.color}50`;
                  e.currentTarget.style.color = btn.color;
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = `0 8px 20px ${btn.color}20`;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                  e.currentTarget.style.color = "var(--text-hi)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}>
                {btn.label}
              </a>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
