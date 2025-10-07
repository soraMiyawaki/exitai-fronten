// src/lib/chatApi.ts
export type ChatRole = "system" | "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };

export type ChatRequest = {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

export async function sendChat(req: ChatRequest) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data as { content: string };
}

// ストリーミング: 受けたテキストを逐次 onToken に流す
export function streamChat(
  req: ChatRequest,
  onToken: (chunk: string) => void,
  onDone?: () => void,
  onError?: (e: unknown) => void
) {
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/chat/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) onToken(decoder.decode(value, { stream: true }));
      }
      onDone?.();
    } catch (e) {
      if ((e as any)?.name === "AbortError") return;
      onError?.(e);
    }
  })();

  return controller;
}
