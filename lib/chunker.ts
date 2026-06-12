export interface Chunk {
  content: string;
  metadata: {
    page?: number;
    position: number;
    docName: string;
  };
}

export function chunkText(text: string, docName: string, chunkSize = 500, overlap = 80): Chunk[] {
  // Split on paragraph boundaries first (more semantic)
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 20);
  const chunks: Chunk[] = [];
  let buffer = "";
  let position = 0;

  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    for (const word of words) {
      buffer += (buffer ? " " : "") + word;
      if (buffer.split(/\s+/).length >= chunkSize) {
        chunks.push({
          content: buffer.trim(),
          metadata: { position: position++, docName },
        });
        // Keep overlap
        const bufWords = buffer.split(/\s+/);
        buffer = bufWords.slice(-overlap).join(" ");
      }
    }
  }

  if (buffer.trim().length > 30) {
    chunks.push({
      content: buffer.trim(),
      metadata: { position: position++, docName },
    });
  }

  return chunks;
}
