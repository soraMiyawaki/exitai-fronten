// src/pages/AIChat.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { sendChat, type ChatMessage } from "../lib/chatApi";

/**
 * 会社専用 技術サポートチャット UI（黒・白・赤のモダンスタイル）
 * 機能:
 * - カテゴリ選択（ネットワーク/ソフトウェア/ハードウェア/一般）
 * - よくある質問のサジェストチップ
 * - テキストファイルの添付（内容を取り込み）
 * - 送信/停止（Abort）ボタン
 * - ローカル保存（lastChat & lastCategory）
 * - （拡張余地）会話IDや履歴APIに接続しやすい構造
 */
export default function AIChat() {
  // ====== 状態 ======
  const [category, setCategory] = useState<string>("一般");
  const [systemPrompt, setSystemPrompt] = useState(
    "あなたは日本語で丁寧に回答する技術サポートのアシスタントです。問題の再現手順、原因候補、対処手順を簡潔に提示し、必要なら注意点も併記してください。"
  );
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // ====== 洗練された体験のための定義 ======
  const suggestions = [
    "パスワードをリセットする方法は？",
    "ネットワークが繋がらないときの確認項目は？",
    "ソフトのインストールに失敗します。原因は？",
    "ログの取り方と提出手順を教えて",
  ];

  const categories = ["一般", "ネットワーク", "ソフトウェア", "ハードウェア"] as const;

  const canSend = useMemo(() => !loading && input.trim().length > 0, [loading, input]);

  // ====== ローカル保存（簡易メモリ） ======
  useEffect(() => {
    // 起動時に前回の会話とカテゴリを復元
    const saved = localStorage.getItem("lastChat");
    const savedCat = localStorage.getItem("lastCategory");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setMsgs(parsed);
      } catch {}
    }
    if (savedCat) setCategory(savedCat);
  }, []);

  useEffect(() => {
    // メッセージが更新されるたびに画面最下部へ
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, loading]);

  useEffect(() => {
    // カテゴリ変更を保存
    localStorage.setItem("lastCategory", category);
  }, [category]);

  // ====== ファイル添付 ======
  const handleFileUpload = async (file: File) => {
    setFileName(file.name);
    if (file && file.type.startsWith("text")) {
      const text = await file.text();
      // 取り込みは最大1000文字（過大な入力はモデル遅延の原因になる）
      setFileContent(text.slice(0, 1000));
    } else {
      // 画像やバイナリはここでは読み込まず、サーバにアップロードする設計に拡張可
      setFileContent(null);
    }
  };

  const clearAttachment = () => {
    setFileContent(null);
    setFileName(null);
  };

  // ====== 送信処理 ======
  const handleSend = async () => {
    if (!canSend) return;

    setLoading(true);

    // カテゴリベースのシステムプロンプト（必要に応じて拡張）
    const categoryPrompt =
      category !== "一般"
        ? `あなたは${category}分野の技術サポート専門のアシスタントです。\n${systemPrompt}`
        : systemPrompt;

    const contentWithAttach =
      input.trim() +
      (fileContent
        ? `\n\n[添付テキスト(${fileName ?? "file"})]\n${fileContent}`
        : "");

    const userMsg: ChatMessage = { role: "user", content: contentWithAttach };
    const history: ChatMessage[] = [{ role: "system", content: categoryPrompt }, ...msgs, userMsg];

    // ユーザーメッセージを即時表示
    setMsgs((prev) => [...prev, userMsg]);
    setInput("");

    try {
      // 既存のリクエストがあれば中断
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      // API呼び出し
      const data = await sendChat(history, { signal: abortRef.current.signal });
      const assistant: ChatMessage = { role: "assistant", content: data.content };
      setMsgs((prev) => [...prev, assistant]);

      // ローカル保存
      localStorage.setItem("lastChat", JSON.stringify([...msgs, userMsg, assistant]));
    } catch (e: any) {
      setMsgs((prev) => [
        ...prev,
        { role: "assistant", content: `エラーが発生しました: ${e?.message ?? e}` },
      ]);
    } finally {
      setLoading(false);
      // 添付は一回使ったらクリア（継続添付したい場合はコメントアウト）
      clearAttachment();
    }
  };

  // ====== 停止（Abort） ======
  const handleStop = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  // ====== UI ======
  return (
    <div className="mx-auto max-w-4xl p-4 md:p-6 bg-white text-gray-900">
      {/* Header */}
      <header className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-black">Support</span>
          <span className="px-2">/</span>
          <span className="text-red-600">Chatbot</span>
        </h1>

        {/* Category Selector */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">カテゴリ</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded border px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* New Chat: ローカルの簡易リセット */}
          <button
            className="ml-2 rounded bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200"
            onClick={() => {
              setMsgs([]);
              localStorage.removeItem("lastChat");
            }}
            title="新しいチャット"
          >
            新規
          </button>
        </div>
      </header>

      {/* System Prompt */}
      <div className="mb-4">
        <label className="mb-1 block text-sm text-gray-600">システムプロンプト</label>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={2}
          className="w-full rounded border p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="会話全体の前提や制約をここに記述します。"
        />
      </div>

      {/* Chat Area */}
      <div className="mb-3 rounded-2xl border">
        {/* Message list */}
        <div className="max-h-[60vh] overflow-y-auto p-3 md:p-4 space-y-3">
          {msgs.map((m, idx) => {
            const isUser = m.role === "user";
            return (
              <div
                key={idx}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 shadow-sm text-[15px] md:text-base
                  ${isUser ? "bg-black text-white" : "bg-red-600 text-white"}`}
                >
                  <div className="mb-1 text-xs opacity-70">
                    {isUser ? "You" : m.role === "assistant" ? "AI" : "System"}
                  </div>
                  <div>{m.content}</div>
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl bg-red-600 px-3 py-2 shadow-sm text-[15px] md:text-base text-white">
                <div className="mb-1 text-xs opacity-70">AI</div>
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

        {/* Suggestions */}
        <div className="border-t bg-gray-50/60 px-3 py-2 md:px-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">サジェスト:</span>
            {suggestions.map((s, i) => (
              <button
                key={i}
                className="text-xs rounded-full bg-white px-3 py-1 shadow hover:bg-gray-100"
                onClick={() => setInput(s)}
                type="button"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input Row */}
      <div className="flex flex-col gap-2 md:flex-row md:items-start">
        <div className="flex-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            rows={3}
            className="min-h-[56px] w-full rounded border p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="質問を入力（Shift+Enterで改行、Enterで送信）"
          />
          {/* Attachment pill */}
          {fileName && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs">
              <span className="truncate max-w-[220px]">{fileName}</span>
              <button
                type="button"
                onClick={clearAttachment}
                className="rounded bg-gray-200 px-2 py-0.5 hover:bg-gray-300"
                title="添付をクリア"
              >
                クリア
              </button>
            </div>
          )}
        </div>

        <div className="flex w-full gap-2 md:w-auto">
          {/* Attach button */}
          <label className="flex flex-1 cursor-pointer items-center justify-center rounded border px-3 py-2 text-sm hover:bg-gray-50 md:flex-none">
            添付
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </label>

          {/* Stop */}
          <button
            onClick={handleStop}
            disabled={!loading}
            className="flex-1 rounded border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-40 md:flex-none"
            title="生成を停止"
          >
            停止
          </button>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex-1 rounded bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50 md:flex-none"
            title={canSend ? "送信" : "入力してください"}
          >
            {loading ? "送信中…" : "送信"}
          </button>
        </div>
      </div>

      <p className="mt-3 text-xs text-gray-500">
        ※ バックエンドの <code>.env</code> に APIキー未設定時は <code>(echo)</code> 応答になります。
      </p>
    </div>
  );
}
