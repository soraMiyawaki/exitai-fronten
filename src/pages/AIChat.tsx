// src/pages/AIChat.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { sendChat, type ChatMessage } from "../lib/chatApi"; // パスは環境に合わせて

export default function AIChat() {
  // 画面内状態
  const [systemPrompt, setSystemPrompt] = useState(
    "あなたは日本語で丁寧に回答するアシスタントです。必要に応じて箇条書きや短いコード例を用いて、簡潔かつ具体的に答えてください。"
  );
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 送信可能かどうか
  const canSend = useMemo(() => !loading && input.trim().length > 0, [loading, input]);

  // スクロールを最下部へ
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, loading]);

  // 送信処理
  const handleSend = async () => {
    if (!canSend) return;

    setLoading(true);

    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const history: ChatMessage[] = [{ role: "system", content: systemPrompt }, ...msgs, userMsg];

    // まずユーザー発言を表示
    setMsgs((prev) => [...prev, userMsg]);
    setInput("");

    // 途中で前回のリクエストが残っていれば中断
    try {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      // 先に空のアシスタントメッセージ枠を置いておく（ローディング中の見た目用）
      const draftId = crypto.randomUUID();
      setMsgs((prev) => [...prev, { role: "assistant", content: ``, /* @ts-ignore */ id: draftId }]);

      // API 呼び出し
      const data = await sendChat(history, { signal: abortRef.current.signal });

      // 応答テキストを下書きに反映
      setMsgs((prev) =>
        prev.map((m: any) => (m.id === draftId ? { ...m, content: data.content } : m))
      );
    } catch (e: any) {
      // エラー発生時はエラーメッセージを表示
      setMsgs((prev) => [
        ...prev,
        { role: "assistant", content: `エラーが発生しました: ${e?.message ?? e}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Enter で送信（Shift+Enterで改行）
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">AI Chat</h1>
      </header>

      {/* システムプロンプト（任意で編集可能） */}
      <div className="mb-4">
        <label className="mb-1 block text-sm text-gray-600">システムプロンプト</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={2}
          className="w-full rounded border p-2 text-sm"
          placeholder="会話全体の前提や制約をここに記述します。"
        />
      </div>

      {/* メッセージ一覧 */}
      <div className="mb-4 space-y-3 rounded-2xl border bg-white p-3 md:p-4">
        {msgs.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div key={idx} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[15px] md:text-base ${
                  isUser ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                <div className="mb-1 text-xs opacity-60">
                  {isUser ? "You" : m.role === "assistant" ? "AI" : "System"}
                </div>
                <div>{m.content}</div>
              </div>
            </div>
          );
        })}

        {/* ローディングインジケータ */}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-gray-100 px-3 py-2 text-[15px] md:text-base">
              <div className="mb-1 text-xs opacity-60">AI</div>
              <span className="inline-flex items-center gap-1">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse [animation-delay:0.1s]">●</span>
                <span className="animate-pulse [animation-delay:0.2s]">●</span>
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 入力欄 */}
      <div className="flex items-start gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={3}
          className="min-h-[52px] flex-1 rounded border p-2"
          placeholder="Shift+Enterで改行、Enterで送信"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="h-[52px] min-w-[84px] rounded bg-black px-4 text-white disabled:opacity-50"
          title={canSend ? "送信" : "入力してください"}
        >
          {loading ? "送信中…" : "送信"}
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        ※ バックエンドの `.env` に API キー未設定の場合は <code>(echo)</code> 応答になります。
      </p>
    </div>
  );
}
