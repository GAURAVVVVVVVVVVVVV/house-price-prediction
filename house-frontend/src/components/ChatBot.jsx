import { useState, useRef, useEffect } from "react";

const SUGGESTIONS = [
  "Is this a good price for this property?",
  "Should I buy or rent in this city?",
  "How can I negotiate a better price?",
  "What's the rental yield for this property?",
  "Explain the SHAP prediction to me",
  "Is this a good investment for 10 years?",
  "What are the hidden costs of buying?",
  "How does crime rate affect property value?",
];

function formatINR(v) {
  if (!v) return "—";
  if (v >= 10000000) return `₹${(v/10000000).toFixed(2)} Cr`;
  if (v >= 100000)   return `₹${(v/100000).toFixed(2)} L`;
  return `₹${v.toLocaleString("en-IN")}`;
}

function MessageText({ text }) {
  const lines = text.split("\n");
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} style={{ height:4 }}/>;
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((p, j) =>
          p.startsWith("**") && p.endsWith("**")
            ? <strong key={j} style={{ color:"var(--text-hi)", fontWeight:700 }}>{p.slice(2,-2)}</strong>
            : p
        );
        if (line.trimStart().startsWith("- ") || line.trimStart().startsWith("• ")) {
          return (
            <div key={i} style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
              <span style={{ color:"var(--accent)", flexShrink:0, marginTop:2 }}>▸</span>
              <span>{rendered.map((p,j) => typeof p==="string" ? p.replace(/^[-•]\s*/,"") : p)}</span>
            </div>
          );
        }
        return <div key={i}>{rendered}</div>;
      })}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display:"flex", gap:5, alignItems:"center", padding:"14px 16px" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{
          width:7, height:7, borderRadius:"50%",
          background:"var(--accent)",
          animation:`chatBounce 1.2s ease ${i*0.15}s infinite`,
        }}/>
      ))}
      <style>{`
        @keyframes chatBounce {
          0%,60%,100%{transform:translateY(0)}
          30%{transform:translateY(-8px)}
        }
      `}</style>
    </div>
  );
}

export default function ChatBot({ propertyCtx, result }) {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [showSugg, setShowSugg] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting = result
        ? `Hi! I'm your ProphetAI advisor. I can see you're looking at a **${propertyCtx?.bhk} BHK** in **${propertyCtx?.city}** priced at **${formatINR(result.predicted_price)}**.\n\nAsk me anything about this property, the market, negotiations, EMI, or investment potential!`
        : `Hi! I'm your ProphetAI real estate advisor.\n\nPredict a property price first and I'll give you **context-aware advice** about that specific property. Or just ask me anything about Indian real estate!`;
      setMessages([{ role:"assistant", content: greeting, greeting: true }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const sendMessage = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput(""); setShowSugg(false); setError("");
    const newMessages = [...messages, { role:"user", content: msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const API = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages
            .filter(m => !m.greeting)
            .map(m => ({ role: m.role, content: m.content })),
          property_ctx: propertyCtx,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "API error");
      }
      const data = await res.json();
      setMessages(prev => [...prev, { role:"assistant", content: data.reply }]);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([]); setShowSugg(true); setError("");
    setTimeout(() => {
      const greeting = result
        ? `Hi again! Ask me anything about this **${propertyCtx?.bhk} BHK** in **${propertyCtx?.city}**.`
        : `Chat cleared! Ask me anything about Indian real estate.`;
      setMessages([{ role:"assistant", content: greeting, greeting: true }]);
    }, 100);
  };

  return (
    <>
      {/* ── FLOATING BUTTON ── */}
      <button onClick={() => setOpen(o => !o)} style={{
        position:"fixed", bottom:32, right:32,
        width:58, height:58, borderRadius:"50%",
        background: open
          ? "var(--bg-raised)"
          : "linear-gradient(135deg,var(--accent),#b44dff)",
        border: open ? "1px solid var(--border-md)" : "none",
        color:"#fff", fontSize:24, cursor:"pointer", zIndex:1000,
        boxShadow: open ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 24px rgba(124,110,255,0.5)",
        transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        display:"flex", alignItems:"center", justifyContent:"center",
      }}>
        {open ? "✕" : "💬"}
        {!open && messages.length === 0 && (
          <div style={{
            position:"absolute", top:6, right:6,
            width:12, height:12, borderRadius:"50%",
            background:"var(--gold)", border:"2px solid var(--bg-base)",
            animation:"blink 2s infinite"
          }}/>
        )}
      </button>

      {/* ── CHAT PANEL ── */}
      <div style={{
        position:"fixed", bottom:104, right:32,
        width:420, height:580,
        background:"var(--bg-surface)",
        border:"1px solid var(--border-md)",
        borderRadius:20,
        boxShadow:"0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,110,255,0.1)",
        display:"flex", flexDirection:"column",
        zIndex:999, overflow:"hidden",
        transform: open ? "scale(1) translateY(0)" : "scale(0.92) translateY(20px)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        transformOrigin:"bottom right",
      }}>

        {/* Header */}
        <div style={{
          padding:"16px 18px",
          background:"linear-gradient(135deg,rgba(124,110,255,0.12),rgba(180,77,255,0.08))",
          borderBottom:"1px solid var(--border)",
          display:"flex", alignItems:"center", gap:12, flexShrink:0,
        }}>
          <div style={{
            width:38, height:38, borderRadius:10, flexShrink:0,
            background:"linear-gradient(135deg,var(--accent),#b44dff)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:18, boxShadow:"0 4px 12px rgba(124,110,255,0.35)"
          }}>🏠</div>

          <div style={{ flex:1 }}>
            <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:15, color:"var(--text-hi)" }}>
              ProphetAI Advisor
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2 }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"var(--green)", animation:"blink 2s infinite" }}/>
              <span style={{ fontSize:11, color:"var(--green)", fontWeight:600 }}>
                Online · Powered by Gemini
              </span>
            </div>
          </div>

          {result && (
            <div style={{
              padding:"4px 10px", borderRadius:20,
              background:"rgba(245,200,66,0.12)",
              border:"1px solid rgba(245,200,66,0.25)",
              fontSize:10, color:"var(--gold)", fontWeight:700,
            }}>
              {propertyCtx?.city} · {formatINR(result.predicted_price)}
            </div>
          )}

          <button onClick={clearChat} title="Clear chat" style={{
            width:28, height:28, borderRadius:8,
            background:"rgba(255,255,255,0.05)",
            border:"1px solid var(--border)", color:"var(--text-lo)",
            fontSize:14, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all 0.15s", flexShrink:0,
          }}>↺</button>
        </div>

        {/* Messages */}
        <div style={{
          flex:1, overflowY:"auto", padding:"16px",
          display:"flex", flexDirection:"column", gap:12,
        }}>
          {messages.map((msg, i) => (
            <div key={i} style={{
              display:"flex",
              justifyContent: msg.role==="user" ? "flex-end" : "flex-start",
              animation:"fadeUp 0.3s ease both",
            }}>
              {msg.role === "assistant" && (
                <div style={{
                  width:26, height:26, borderRadius:8, flexShrink:0,
                  background:"linear-gradient(135deg,var(--accent),#b44dff)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:12, marginRight:8, alignSelf:"flex-end", marginBottom:2,
                }}>✦</div>
              )}
              <div style={{
                maxWidth:"78%",
                padding: msg.role==="user" ? "10px 14px" : "12px 14px",
                borderRadius: msg.role==="user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: msg.role==="user"
                  ? "linear-gradient(135deg,var(--accent),#9d5fff)"
                  : "var(--bg-raised)",
                border: msg.role==="user" ? "none" : "1px solid var(--border-md)",
                fontSize:13.5,
                color: msg.role==="user" ? "#fff" : "var(--text-hi)",
                lineHeight:1.6,
                boxShadow: msg.role==="user" ? "0 2px 12px rgba(124,110,255,0.25)" : "none",
              }}>
                {msg.role === "assistant"
                  ? <MessageText text={msg.content}/>
                  : msg.content}
              </div>
              {msg.role === "user" && (
                <div style={{
                  width:26, height:26, borderRadius:8, flexShrink:0,
                  background:"rgba(124,110,255,0.2)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:12, marginLeft:8, alignSelf:"flex-end", marginBottom:2,
                  color:"var(--accent)", fontWeight:700,
                }}>U</div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display:"flex", alignItems:"flex-end", gap:8 }}>
              <div style={{
                width:26, height:26, borderRadius:8, flexShrink:0,
                background:"linear-gradient(135deg,var(--accent),#b44dff)",
                display:"flex", alignItems:"center", justifyContent:"center", fontSize:12,
              }}>✦</div>
              <div style={{ background:"var(--bg-raised)", border:"1px solid var(--border-md)", borderRadius:"16px 16px 16px 4px" }}>
                <TypingIndicator/>
              </div>
            </div>
          )}

          {error && (
            <div style={{
              background:"rgba(255,107,138,0.08)", border:"1px solid rgba(255,107,138,0.2)",
              borderRadius:10, padding:"10px 14px", fontSize:12, color:"var(--rose)", lineHeight:1.5,
            }}>
              ⚠ {error}
              {error.includes("GEMINI_API_KEY") && (
                <div style={{ marginTop:8, color:"var(--text-lo)", fontSize:11 }}>
                  In PowerShell run:<br/>
                  <code style={{ background:"rgba(255,255,255,0.06)", padding:"2px 6px", borderRadius:4, color:"var(--teal)", fontSize:10 }}>
                    [System.Environment]::SetEnvironmentVariable("GEMINI_API_KEY","your-key","User")
                  </code><br/>
                  Then restart VS Code and uvicorn.
                </div>
              )}
            </div>
          )}

          {showSugg && messages.length <= 1 && !loading && (
            <div style={{ marginTop:4 }}>
              <div style={{ fontSize:10, color:"var(--text-lo)", letterSpacing:1.5, textTransform:"uppercase", fontWeight:700, marginBottom:8 }}>
                Suggested questions
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {SUGGESTIONS.slice(0, result ? 6 : 4).map(s => (
                  <button key={s} onClick={() => sendMessage(s)} style={{
                    padding:"8px 12px", textAlign:"left",
                    background:"var(--bg-raised)", border:"1px solid var(--border-md)",
                    borderRadius:10, color:"var(--text-md)", fontSize:12, fontWeight:500,
                    cursor:"pointer", fontFamily:"'Satoshi',sans-serif", transition:"all 0.15s",
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor="rgba(124,110,255,0.4)"; e.currentTarget.style.color="var(--text-hi)"; e.currentTarget.style.background="rgba(124,110,255,0.06)"; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor="var(--border-md)"; e.currentTarget.style.color="var(--text-md)"; e.currentTarget.style.background="var(--bg-raised)"; }}>
                    ▸ {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{ padding:"12px 14px", borderTop:"1px solid var(--border)", background:"var(--bg-surface)", flexShrink:0 }}>
          <div style={{
            display:"flex", gap:8, alignItems:"flex-end",
            background:"var(--bg-raised)", border:"1px solid var(--border-md)",
            borderRadius:14, padding:"8px 8px 8px 14px", transition:"border-color 0.2s",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about this property..."
              rows={1}
              style={{
                flex:1, background:"transparent", border:"none", outline:"none",
                color:"var(--text-hi)", fontSize:13.5,
                fontFamily:"'Satoshi',sans-serif", resize:"none",
                lineHeight:1.5, maxHeight:100, overflowY:"auto",
              }}
              onInput={e => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
              }}
            />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading} style={{
              width:34, height:34, borderRadius:10, flexShrink:0,
              background: input.trim() && !loading ? "linear-gradient(135deg,var(--accent),#b44dff)" : "rgba(255,255,255,0.05)",
              border:"none",
              color: input.trim() && !loading ? "#fff" : "var(--text-lo)",
              fontSize:15, cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              display:"flex", alignItems:"center", justifyContent:"center",
              transition:"all 0.2s",
              boxShadow: input.trim() && !loading ? "0 2px 10px rgba(124,110,255,0.3)" : "none",
            }}>
              {loading
                ? <span className="spin" style={{ width:14, height:14, borderWidth:2 }}/>
                : "↑"}
            </button>
          </div>
          <div style={{ fontSize:10, color:"var(--text-lo)", textAlign:"center", marginTop:7, letterSpacing:0.3 }}>
            Powered by Gemini Flash · Press Enter to send
          </div>
        </div>
      </div>
    </>
  );
}