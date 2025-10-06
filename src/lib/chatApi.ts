// src/lib/chatApi.ts
export async function sendChatMessage(message: string): Promise<string> {
  // ベースURLは環境変数で指定（未設定なら空文字 → 相対パス利用）
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    if (!res.ok) {
      throw new Error(`API response status: ${res.status}`);
    }
    // 応答のContent-Typeに応じて解析
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await res.json();
      // バックエンドがJSONを返す場合、contentフィールドから応答テキストを取得
      if (typeof data === "string") {
        return data;
      } else if (data.content) {
        return data.content;
      } else if (data.reply) {
        return data.reply;
      } else if (data.message) {
        return data.message;
      } else {
        // 構造が異なる場合はJSON全体を文字列化
        return JSON.stringify(data);
      }
    } else {
      // JSON以外（プレーンテキスト）の場合
      return await res.text();
    }
  } catch (error) {
    console.error("sendChatMessage error:", error);
    throw error; // 呼び出し側で処理
  }
}
