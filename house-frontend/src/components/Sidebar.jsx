export default function Sidebar({ page, setPage }) {
  const nav = [
    { id:"predict",   icon:"⬡", label:"Predict Price"  },
    { id:"image",     icon:"📸", label:"Image Analysis", badge:"AI" },
    { id:"compare",   icon:"◈", label:"City Compare"   },
    { id:"dashboard", icon:"◉", label:"Dashboard"      },
    { id:"about",     icon:"★", label:"About"          },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="brand">
          <div className="brand-orb">⌂</div>
          <div className="brand-text">
            <div className="brand-name">ProphetAI</div>
            <div className="brand-tag">Price Engine</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {nav.map(n => (
          <button key={n.id}
            className={`nav-btn ${page === n.id ? "active" : ""}`}
            onClick={() => setPage(n.id)}>
            <span className="nav-icon">{n.icon}</span>
            {n.label}
            {n.badge && (
              <span style={{
                marginLeft:"auto", fontSize:9, fontWeight:800,
                letterSpacing:1, color:"var(--gold)",
                background:"rgba(245,200,66,0.12)",
                border:"1px solid rgba(245,200,66,0.25)",
                borderRadius:20, padding:"2px 7px",
                textTransform:"uppercase"
              }}>{n.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="status-pill">
          <div className="status-dot"/>
          <span className="status-text">Model Live</span>
        </div>
        <div className="meta-text">
          XGBoost · R² 0.984<br/>
          5 Cities · 12K Records<br/>
          Vision AI · By Gaurav
        </div>
      </div>
    </aside>
  );
}
