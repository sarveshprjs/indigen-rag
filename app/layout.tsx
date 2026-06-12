import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indigen RAG — Document Intelligence Platform",
  description: "Multi-agent agentic RAG with hybrid retrieval, grounding verification, and reliability guardrails",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
