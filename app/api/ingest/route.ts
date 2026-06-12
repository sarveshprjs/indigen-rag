import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { chunkText } from "@/lib/chunker";
import { embedBatch } from "@/lib/embeddings";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!file.name.endsWith(".pdf"))
      return NextResponse.json({ error: "Only PDF files accepted" }, { status: 400 });
    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });

    // Parse PDF
    const buffer = Buffer.from(await file.arrayBuffer());
    // Dynamic import to avoid SSR issues
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    const text = parsed.text;

    if (!text || text.trim().length < 50)
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 422 });

    // Create document record
    const { data: doc, error: docErr } = await supabaseAdmin
      .from("documents")
      .insert({ name: file.name, source: "upload" })
      .select()
      .single();

    if (docErr) throw docErr;

    // Chunk
    const chunks = chunkText(text, file.name);

    // Embed in batches of 20
    const batchSize = 20;
    let inserted = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddings = await embedBatch(batch.map((c) => c.content));

      const rows = batch.map((chunk, j) => ({
        doc_id: doc.id,
        content: chunk.content,
        metadata: { ...chunk.metadata, docName: file.name },
        embedding: embeddings[j],
      }));

      const { error: insertErr } = await supabaseAdmin.from("chunks").insert(rows);
      if (insertErr) throw insertErr;
      inserted += batch.length;
    }

    return NextResponse.json({
      success: true,
      document: { id: doc.id, name: file.name },
      chunks: inserted,
      pages: parsed.numpages,
    });
  } catch (err) {
    console.error("Ingest error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Ingestion failed" },
      { status: 500 }
    );
  }
}
