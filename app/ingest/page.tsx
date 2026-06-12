"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

interface Doc { id: string; name: string; uploaded_at: string; }
interface UploadResult { document: { id: string; name: string }; chunks: number; pages: number; }

export default function IngestPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocs(data.documents ?? []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const uploadFile = async (file: File) => {
    if (!file.name.endsWith(".pdf")) { setError("Only PDF files are supported"); return; }
    setUploading(true); setError(null); setResult(null);
    setProgress("Parsing PDF...");

    const fd = new FormData();
    fd.append("file", file);

    try {
      setProgress("Chunking and embedding...");
      const res = await fetch("/api/ingest", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setResult(data);
      setProgress(null);
      loadDocs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setProgress(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "var(--bg2)", borderBottom: "1px solid var(--border)", padding: "1rem 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, var(--accent), var(--accent2))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
            <span style={{ fontWeight: 700, color: "var(--text)", fontSize: 13 }}>Indigen RAG</span>
          </Link>
          <span style={{ color: "var(--text3)" }}>/</span>
          <span style={{ color: "var(--text2)", fontSize: 13 }}>Document Ingest</span>
        </div>
        <Link href="/chat">
          <button className="btn-primary" style={{ fontSize: 12 }}>→ Go to Chat</button>
        </Link>
      </div>

      <div style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <div style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 6 }}>Upload Documents</h1>
          <p style={{ color: "var(--text2)", fontSize: 13 }}>
            PDFs are parsed, chunked with overlap, embedded with OpenAI text-embedding-3-small, and stored in Supabase pgvector. Hybrid retrieval (semantic + BM25) is available immediately.
          </p>
        </div>

        {/* Pipeline steps */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1.5rem", flexWrap: "wrap" }}>
          {["1. PDF parse", "2. Smart chunk", "3. Embed (1536d)", "4. pgvector store", "5. BM25 index"].map((s, i) => (
            <div key={s} className="badge badge-purple" style={{ fontSize: 11 }}>
              {s}
            </div>
          ))}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileRef.current?.click()}
          style={{
            border: "2px dashed " + (dragging ? "var(--accent)" : "var(--border2)"),
            borderRadius: 12,
            padding: "3rem 2rem",
            textAlign: "center",
            cursor: uploading ? "not-allowed" : "pointer",
            background: dragging ? "rgba(124,111,255,0.05)" : "var(--bg2)",
            transition: "all 0.15s",
            marginBottom: "1.5rem",
          }}
        >
          <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />

          {uploading ? (
            <div>
              <div className="spin" style={{ display: "inline-block", fontSize: 28, marginBottom: 12 }}>⚙</div>
              <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 4 }}>{progress}</div>
              <div style={{ color: "var(--text3)", fontSize: 12 }}>This may take 30–60 seconds for large PDFs</div>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📄</div>
              <div style={{ color: "var(--text)", fontWeight: 600, marginBottom: 6 }}>Drop a PDF here or click to browse</div>
              <div style={{ color: "var(--text3)", fontSize: 12 }}>Max 10MB · PDF only · Chunked at 500 words with 80-word overlap</div>
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <div className="glass fade-in" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem", borderColor: "rgba(34,197,94,0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ color: "var(--green)", fontSize: 18 }}>✓</span>
              <span style={{ fontWeight: 600, color: "var(--text)" }}>{result.document.name}</span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <span className="badge badge-green">{result.pages} pages parsed</span>
              <span className="badge badge-teal">{result.chunks} chunks embedded</span>
              <span className="badge badge-purple">Ready for retrieval</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass fade-in" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem", borderColor: "rgba(239,68,68,0.3)", color: "var(--red)", fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}

        {/* Documents list */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>
            Indexed Documents ({docs.length})
          </div>

          {docs.length === 0 ? (
            <div className="glass" style={{ padding: "2rem", textAlign: "center", color: "var(--text3)", fontSize: 13 }}>
              No documents yet — upload a PDF to get started
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {docs.map((d) => (
                <div key={d.id} className="glass" style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 20 }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 13 }}>{d.name}</div>
                    <div style={{ fontSize: 11, color: "var(--text3)" }}>
                      {new Date(d.uploaded_at).toLocaleString()}
                    </div>
                  </div>
                  <span className="badge badge-teal">indexed</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chunking info box */}
        <div className="glass" style={{ padding: "1rem 1.25rem", marginTop: "1.5rem" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Chunking strategy</div>
          <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.7 }}>
            Documents are split at paragraph boundaries first (semantic splits), then a sliding window of 500 words with 80-word overlap is applied. This preserves context across chunk boundaries and handles tables better than sentence-level splitting. Each chunk is embedded with OpenAI text-embedding-3-small (1536 dimensions) and stored alongside a full-text tsvector for hybrid BM25+semantic retrieval via Reciprocal Rank Fusion.
          </div>
        </div>
      </div>
    </div>
  );
}
