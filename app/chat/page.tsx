"use client";
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function ChatPage() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [traceOpen, setTraceOpen] = useState(true);

  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();
  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const suggestedQueries = [
    "What are the key policy differences across documents?",
    "Are there any contradictions in the documents?",
    "What information is missing or unclear?",
    "Summarise the main findings with citations",
  ];

  const handleSuggestedQuery = (query: string) => {
    if (isLoading) return;
    sendMessage({ text: query });
  };

  const agentStep = isLoading ? "Searching documents..." : null;

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", overflow: "hidden" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: "var(--bg2)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", padding: "1rem", flexShrink: 0 }}>
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8, marginBottom: "1.5rem" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
          <span style={{ fontWeight: 700, color: "var(--text)", fontSize: 13 }}>Indigen RAG</span>
        </Link>

        <nav style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: "1.5rem" }}>
          <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(124,111,255,0.12)", border: "1px solid rgba(124,111,255,0.25)", color: "var(--accent)", fontSize: 13, fontWeight: 600 }}>
            💬 Chat
          </div>
          <Link href="/ingest" style={{ textDecoration: "none", padding: "8px 10px", borderRadius: 8, color: "var(--text2)", fontSize: 13, display: "block" }}>
            📄 Ingest Docs
          </Link>
        </nav>

        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>System Status</div>
        {[
          { label: "Hybrid retrieval", status: "active", color: "var(--green)" },
          { label: "Grounding guard", status: "active", color: "var(--green)" },
          { label: "Circuit breaker", status: "closed", color: "var(--green)" },
          { label: "Multi-agent", status: "ready", color: "var(--teal)" },
        ].map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 11, color: "var(--text2)" }}>{s.label}</span>
            <span style={{ fontSize: 10, color: s.color, fontWeight: 600 }}>{s.status}</span>
          </div>
        ))}
      </div>

      {/* Main chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg2)" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "var(--text)" }}>Document Intelligence Chat</div>
            <div style={{ fontSize: 11, color: "var(--text3)" }}>Grounded · Cited · Multi-agent</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="badge badge-purple">Claude 3.5 Sonnet</span>
            <span className="badge badge-teal">Hybrid RAG</span>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: 16 }}>
            {messages.length === 0 && (
              <div style={{ margin: "auto", textAlign: "center", maxWidth: 480 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Ask anything about your documents</div>
                <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 24, lineHeight: 1.6 }}>
                  I use hybrid semantic + keyword retrieval, verify grounding, and cite every claim.
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {suggestedQueries.map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSuggestedQuery(q)}
                      style={{ background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 8, padding: "10px 14px", color: "var(--text2)", fontSize: 12, cursor: "pointer", textAlign: "left" }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages
              .filter((m) => m.role === "user" || m.role === "assistant")
              .map((m) => {
                // Get visible text content
                const content = m.parts
                  .filter((p) => p.type === "text")
                  .map((p) => (p as { text: string }).text)
                  .join("");

                if (!content && m.role === "assistant") return null;

                return (
                  <div key={m.id} className="fade-in" style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: m.role === "user" ? "row-reverse" : "row" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: m.role === "user" ? "var(--accent)" : "var(--bg3)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                      {m.role === "user" ? "U" : "🤖"}
                    </div>
                    <div style={{ maxWidth: "75%", background: m.role === "user" ? "rgba(124,111,255,0.12)" : "var(--bg2)", border: "1px solid " + (m.role === "user" ? "rgba(124,111,255,0.25)" : "var(--border)"), borderRadius: 12, padding: "10px 14px", fontSize: 13, lineHeight: 1.7, color: "var(--text)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {content}
                    </div>
                  </div>
                );
              })}

            {isLoading && (
              <div className="fade-in" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg3)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>🤖</div>
                <div className="glass-sm" style={{ padding: "10px 14px" }}>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    {agentStep && <span style={{ fontSize: 11, color: "var(--text2)", marginLeft: 6 }}>{agentStep}</span>}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Reasoning trace panel */}
          {traceOpen && (
            <div style={{ width: 260, borderLeft: "1px solid var(--border)", background: "var(--bg2)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Reasoning Trace</span>
                <button onClick={() => setTraceOpen(false)} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 16 }}>×</button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
                {isLoading && agentStep && (
                  <div className="glass-sm" style={{ padding: 10, fontSize: 11, borderColor: "rgba(124,111,255,0.2)" }}>
                    <div className="pulse-dot" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", marginRight: 6 }} />
                    <span style={{ color: "var(--text2)" }}>{agentStep}</span>
                  </div>
                )}
                {!isLoading && (
                  <div style={{ color: "var(--text3)", fontSize: 11, textAlign: "center", paddingTop: 24 }}>
                    Agent steps will appear here during a query
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", background: "var(--bg2)" }}>
          {!traceOpen && (
            <button onClick={() => setTraceOpen(true)} style={{ background: "none", border: "1px solid var(--border2)", borderRadius: 6, padding: "4px 10px", color: "var(--text3)", fontSize: 11, cursor: "pointer", marginBottom: 8 }}>
              Show reasoning trace
            </button>
          )}
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10 }}>
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a question about your documents..."
              disabled={isLoading}
              style={{ flex: 1, background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: 10, padding: "10px 14px", color: "var(--text)", fontSize: 13, outline: "none" }}
            />
            <button type="submit" disabled={isLoading || !(input ?? "").trim()} className="btn-primary" style={{ paddingLeft: 20, paddingRight: 20 }}>
              {isLoading ? "..." : "Send"}
            </button>
          </form>
          <div style={{ marginTop: 6, fontSize: 10, color: "var(--text3)" }}>
            Hybrid retrieval · Grounding verified · Citations required · Contradictions surfaced
          </div>
        </div>
      </div>
    </div>
  );
}