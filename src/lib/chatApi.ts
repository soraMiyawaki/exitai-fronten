// src/lib/chatApi.ts
export type ChatRole = "system" | "user" | "assistant";
export type ChatMessage = { role: ChatRole; content: string };

export type ChatRequest = {
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
};

type SendChatOptions = {
  temperature?: number;
  max_tokens?: number;
  signal?: AbortSignal;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000";

/* ---------- sendChat: オーバーロード ---------- */
// ① ChatRequest そのまま渡す
export async function sendChat(
  req: ChatRequest,
  opts?: { signal?: AbortSignal }
): Promise<{ content: string }>;
// ② messages[] + options で渡す（ChatBox の呼び方）
export async function sendChat(
  messages: ChatMessage[],
  opts?: SendChatOptions
): Promise<{ content: string }>;
// 実装
export async function sendChat(
  arg1: ChatRequest | ChatMessage[],
  arg2?: SendChatOptions | { signal?: AbortSignal }
): Promise<{ content: string }> {
  const isArray = Array.isArray(arg1);

  const req: ChatRequest = isArray
    ? {
        messages: arg1 as ChatMessage[],
        temperature: (arg2 as SendChatOptions | undefined)?.temperature ?? 0.3,
        max_tokens: (arg2 as SendChatOptions | undefined)?.max_tokens ?? 512,
      }
    : (arg1 as ChatRequest);

  const signal: AbortSignal | undefined = isArray
    ? (arg2 as SendChatOptions | undefined)?.signal
    : (arg2 as { signal?: AbortSignal } | undefined)?.signal;

  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text}`);
  }
  return (await res.json()) as { content: string };
}

/* ---------- ストリーミング ---------- */
export type ChatStreamHandlers = {
  onToken: (chunk: string) => void;
  onDone?: () => void;
  onError?: (e: unknown) => void;
};

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
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      onError?.(e);
    }
  })();

  return controller;
}
