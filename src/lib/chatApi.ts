// src/lib/chatApi.ts

// === Types ===
export type Role = "system" | "user" | "assistant";

export type ChatMessage = {
  role: Role;
  content: string;
  // UI側で一時IDを付けるケースがあるため任意
  id?: string;
};

export type ChatResult = {
  content: string;
  model?: string;
  provider?: string;
};

// === Config ===
// Viteの開発時は VITE_API_BASE_URL 未設定でOK（相対 /api をプロキシ）
// 本番や別オリジンのAPIを叩く場合は .env(.local) に VITE_API_BASE_URL を設定
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

// === Main API ===
/**
 * メッセージ履歴をバックエンドの /api/chat に送り、AI応答を取得する。
 * 返り値は常に { content, model?, provider? } 形式に正規化される。
 */
export async function sendChat(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number; signal?: AbortSignal }
): Promise<ChatResult> {
  const payload = {
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 512,
  };

  const res = await fetch(`${API_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: options?.signal,
  });

  if (!res.ok) {
    let text = "";
    try {
      text = await res.text();
    } catch {
      /* noop */
    }
    throw new Error(text || `HTTP ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const data: any = await res.json();

    // 返却形を正規化
    if (typeof data === "string") return { content: data };
    if (data?.content) return { content: data.content, model: data.model, provider: data.provider };
    if (data?.reply) return { content: data.reply };
    if (data?.message) return { content: data.message };

    // 想定外の形はJSONを文字列化して返す
    return { content: JSON.stringify(data) };
  }

  // プレーンテキスト等
  return { content: await res.text() };
}
