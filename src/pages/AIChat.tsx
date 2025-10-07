// src/pages/AIChat.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { streamChat } from "../lib/chatApi";                // ← 値のインポートだけ
import type { ChatMessage } from "../lib/chatApi";          // ← 型は type-only import

const LS_MSGS = "exitai.messages";
const CATS = [
  "インフラ/サーバ",
  "ネットワーク",
  "OS/ミドルウェア",
  "開発/CI",
  "クラウド/Azure",
  "セキュリティ",
  "トラブルシュート",
] as const;
type Category = typeof CATS[number];

const DEFAULT_SYS = (cat: string) =>
  `あなたは${cat}領域のシステムエンジニアです。要件の聞き返し→前提の明確化→箇条書きの手順→最後に注意点の順で、簡潔かつ正確に答えてください。`;

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [cat, setCat] = useState<Category>(CATS[0]);
  const [sys, setSys] = useState(DEFAULT_SYS(CATS[0]));
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 復元
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_MSGS);
      if (raw) setMessages(JSON.parse(raw));
    } catch {}
  }, []);
  // 保存
  useEffect(() => {
    localStorage.setItem(LS_MSGS, JSON.stringify(messages));
  }, [messages]);

  // 自動スクロール
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, isStreaming]);

  const base: ChatMessage[] = useMemo(() => [{ role: "system", content: sys }], [sys]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");

    // placeholder の assistant を差し込んでストリームで埋める
    const idx = next.length;
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    setIsStreaming(true);
    abortRef.current = streamChat(
      { messages: [...base, ...next], temperature: 0.3, max_tokens: 512 },
      (chunk) => {
        setMessages((prev) => {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], content: copy[idx].content + chunk };
          return copy;
        });
      },
      () => {
        setIsStreaming(false);
        abortRef.current = null;
      },
      (err) => {
        console.error(err);
        setIsStreaming(false);
        abortRef.current = null;
        alert("ストリーミング中にエラーが発生しました");
      }
    );
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  };

  const newChat = () => {
    if (isStreaming) stop();
    setMessages([]);
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-white">
      {/* ヘッダー */}
      <header className="flex items-center gap-2 px-4 py-3 border-b">
        <div className="text-lg font-semibold">ExitAI Support</div>
        <div className="ml-auto flex items-center gap-2">
          {/* 視覚的には非表示だが関連付けされたラベル */}
          <label htmlFor="category-select" className="sr-only">
            カテゴリ
          </label>
          <select
            id="category-select"
            title="カテゴリ"               // アクセシブルネームの補助
            aria-label="カテゴリ"
            value={cat}
            onChange={(e) => {
              const c = e.target.value as Category;
              setCat(c);
              setSys(DEFAULT_SYS(c));
            }}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
          >
            {CATS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            onClick={newChat}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            title="新しいチャットを開始"
          >
            新規
          </button>
        </div>
      </header>

      {/* システムプロンプト */}
      <div className="px-4 py-2 border-b bg-neutral-50">
        <label htmlFor="sys-prompt" className="block text-xs text-neutral-500 mb-1">
          システムプロンプト
        </label>
        <textarea
          id="sys-prompt"
          title="システムプロンプト"
          value={sys}
          onChange={(e) => setSys(e.target.value)}
          rows={2}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
      </div>

      {/* メッセージリスト */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-sm text-neutral-500">カテゴリを選んで質問を入力してください。</div>
        )}
        {messages.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[min(900px,90vw)] whitespace-pre-wrap leading-relaxed rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  isUser ? "bg-black text-white" : "bg-red-50 text-neutral-900 border border-red-100"
                }`}
              >
                {m.content || (i === messages.length - 1 && isStreaming ? "…" : "")}
              </div>
            </div>
          );
        })}
      </div>

      {/* 入力エリア */}
      <form onSubmit={onSubmit} className="px-4 py-3 border-t bg-white">
        <div className="flex items-end gap-2">
          {/* 視覚的に隠すが関連付けたラベル */}
          <label htmlFor="chat-input" className="sr-only">
            メッセージ入力
          </label>
          <textarea
            id="chat-input"
            title="メッセージ入力"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="質問を入力…（Shift+Enterで改行）"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            className="flex-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {!isStreaming ? (
            <button
              type="submit"
              className="rounded-xl px-4 py-3 text-sm font-medium shadow bg-red-600 text-white hover:bg-red-700"
            >
              送信
            </button>
          ) : (
            <button
              type="button"
              onClick={stop}
              className="rounded-xl px-4 py-3 text-sm font-medium shadow bg-white border hover:bg-gray-50"
            >
              停止
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
