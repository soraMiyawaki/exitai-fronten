// src/lib/export.ts
import type { ChatMessage } from "./chatApi";

export function exportToMarkdown(messages: ChatMessage[]): string {
  return messages
    .map((m) => {
      const role = m.role === "user" ? "👤 User" : m.role === "assistant" ? "🤖 Assistant" : "⚙️ System";
      return `## ${role}\n\n${m.content}\n`;
    })
    .join("\n---\n\n");
}

export function exportToJSON(messages: ChatMessage[]): string {
  return JSON.stringify(messages, null, 2);
}

export function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportChat(messages: ChatMessage[], format: "md" | "json") {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `chat-${timestamp}.${format}`;

  const content = format === "md" ? exportToMarkdown(messages) : exportToJSON(messages);
  downloadFile(filename, content);
}
