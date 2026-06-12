import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", background: "var(--bg)" }}>
      {/* Logo */}
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", fontSize: 24 }}>
          ⚡
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", marginBottom: 6, letterSpacing: "-0.5px" }}>
          Indigen RAG
        </h1>
        <p style={{ color: "var(--text2)", fontSize: 14, maxWidth: 360, textAlign: "center" }}>
          Multi-agent document intelligence platform with hybrid retrieval, grounding verification, and reliability guardrails
        </p>
      </div>

      {/* Phase badges */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: "2rem" }}>
        <span className="badge badge-green">✓ Phase 0 — Foundation</span>
        <span className="badge badge-green">✓ Phase 1 — Hybrid Retrieval</span>
        <span className="badge badge-purple">✓ Phase 2 — Multi-Agent</span>
        <span className="badge badge-teal">✓ Phase 3 — Reliability</span>
        <span className="badge badge-amber">⚡ Phase 4 — Eval (partial)</span>
      </div>

      {/* Nav cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, width: "100%", maxWidth: 520 }}>
        <Link href="/chat" style={{ textDecoration: "none" }}>
          <div className="glass" style={{ padding: "1.5rem", cursor: "pointer", transition: "border-color 0.15s", borderColor: "rgba(124,111,255,0.3)" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>💬</div>
            <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Chat</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>Multi-agent RAG with streaming reasoning trace</div>
          </div>
        </Link>
        <Link href="/ingest" style={{ textDecoration: "none" }}>
          <div className="glass" style={{ padding: "1.5rem", cursor: "pointer", transition: "border-color 0.15s" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
            <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>Ingest</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>Upload PDFs — chunked, embedded, indexed</div>
          </div>
        </Link>
      </div>

      <p style={{ marginTop: "2rem", color: "var(--text3)", fontSize: 11 }}>
        Sarvesh Bhushan Upasani · Indigen Services Technical Assessment
      </p>
    </div>
  );
}
