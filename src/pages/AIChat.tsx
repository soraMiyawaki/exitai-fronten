import { useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant" | "system";
type Msg = { id: string; role: Role; content: string; ts: string };

const STORE_KEY = "ai_chat";
const nowISO = () => new Date().toISOString();

function useChatStore() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  useEffect(() => {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) setMsgs(JSON.parse(raw) as Msg[]);
    else {
      const seed: Msg[] = [
        { id: crypto.randomUUID(), role: "system", ts: nowISO(), content: "AIアシスタントへようこそ。スカウト要約やプロフィール改善など、何でも聞いてください。" },
      ];
      setMsgs(seed);
      localStorage.setItem(STORE_KEY, JSON.stringify(seed));
    }
  }, []);

  useEffect(() => {
    if (msgs.length) localStorage.setItem(STORE_KEY, JSON.stringify(msgs));
  }, [msgs]);

  return { msgs, setMsgs };
}

function autoReply(userText: string): string {
  const t = userText.toLowerCase();
  if (t.includes("スカウト") || t.includes("scout")) {
    return [
      "最近のスカウトを要約しました：",
      "• 適合度が高い順に3件をピックアップ ✅",
      "• 次にやること：1) 気になる求人を保存 2) プロフィール要約を最新化",
      "",
      "必要なら“保存済みだけ”や“新着だけ”に絞って再要約もできます。"
    ].join("\n");
  }
  if (t.includes("プロフィール") || t.includes("改善")) {
    return [
      "プロフィール改善ポイント 👇",
      "1) タイトルに役割＋主要スキル（例: フロントエンド｜React / TypeScript）",
      "2) 実績は数値で（例: パフォーマンス改善でLCP 40%短縮）",
      "3) 最近の学習トピックを“継続学習”として明記",
      "",
      "よければ、今のプロフィール文を貼ってください。提案文へ書き換えます。"
    ].join("\n");
  }
  if (t.includes("要約") || t.includes("summary")) {
    return "テキストを貼ってください。300文字程度で読みやすい要約に整えます。";
  }
  return "承知しました。もう少し具体的に教えてください（例：『最新スカウトを要約』『プロフィール改善提案』『この文章を要約』）。";
}

export default function AIChat() {
  const { msgs, setMsgs } = useChatStore();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(
    () => [
      "最新のスカウトを要約して",
      "プロフィール文を良い感じに書き換えて",
      "この職務経歴書を300字で要約（→ペースト）",
    ],
    []
  );

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  const send = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setText("");
    const mine: Msg = { id: crypto.randomUUID(), role: "user", content: t, ts: nowISO() };
    setMsgs((prev) => [...prev, mine]);

    // ストリーミング風の返信
    setBusy(true);
    const replyFull = autoReply(t);
    const draft: Msg = { id: crypto.randomUUID(), role: "assistant", content: "", ts: nowISO() };
    setMsgs((prev) => [...prev, draft]);

    let i = 0;
    const step = () => {
      i += Math.max(1, Math.floor(replyFull.length / 40)); // だいたい40ステップ
      const chunk = replyFull.slice(0, i);
      setMsgs((prev) => prev.map((m) => (m.id === draft.id ? { ...m, content: chunk } : m)));
      if (i < replyFull.length) {
        setTimeout(step, 20);
      } else {
        setBusy(false);
      }
    };
    setTimeout(step, 80);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const clearChat = () => {
    if (!confirm("この会話をすべて削除しますか？")) return;
    const seed: Msg[] = [
      { id: crypto.randomUUID(), role: "system", ts: nowISO(), content: "リセットしました。改めて質問してください。" },
    ];
    setMsgs(seed);
  };

  const exportChat = () => {
    const blob = new Blob([JSON.stringify(msgs, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `chat-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="grid lg:grid-cols-[1fr] gap-4">
      {/* ツールバー */}
      <div className="card flex items-center justify-between">
        <div className="flex gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              className="btn-outline"
              onClick={() => setText((t) => (t ? t : s))}
              title="クリックで入力欄に挿入"
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn-outline" onClick={exportChat}>エクスポート</button>
          <button className="btn-outline" onClick={clearChat}>クリア</button>
        </div>
      </div>

      {/* 会話ログ */}
      <div className="card h-[60vh] overflow-auto" ref={listRef}>
        <div className="space-y-3">
          {msgs.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={
                  "max-w-[78%] rounded-2xl px-3 py-2 shadow-sm whitespace-pre-wrap " +
                  (m.role === "user"
                    ? "bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-500 text-white"
                    : m.role === "assistant"
                    ? "bg-slate-100 dark:bg-slate-800"
                    : "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200")
                }
              >
                <Message content={m.content} />
                <div className="text-[11px] opacity-70 mt-1">
                  {new Date(m.ts).toLocaleString()}
                </div>
              </div>
            </div>
          ))}

          {busy && (
            <div className="flex justify-start">
              <div className="max-w-[78%] rounded-2xl px-3 py-2 bg-slate-100 dark:bg-slate-800 shadow-sm">
                <span className="inline-flex gap-1 items-center">
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse"></span>
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse [animation-delay:.15s]"></span>
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse [animation-delay:.3s]"></span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 入力欄 */}
      <div className="card">
        <div className="mb-2 text-xs opacity-70">Enterで送信 / Shift+Enterで改行</div>
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder="例）最新のスカウトを要約して"
            rows={3}
            className="input min-h-[60px]"
          />
          <button onClick={send} disabled={busy || !text.trim()} className="btn-primary disabled:opacity-50">
            送信
          </button>
        </div>
      </div>
    </div>
  );
}

function Message({ content }: { content: string }) {
  // かんたんコードブロック表示（``` で囲むと <pre> 風に）
  if (content.includes("```")) {
    const parts = content.split(/```/g);
    return (
      <div className="space-y-2">
        {parts.map((p, i) =>
          i % 2 === 1 ? (
            <pre key={i} className="overflow-auto rounded-xl p-3 bg-slate-900 text-slate-100 text-[12px]">
              <code>{p.trim()}</code>
            </pre>
          ) : (
            <p key={i}>{p}</p>
          )
        )}
      </div>
    );
  }
  // 箇条書きの見た目を少し整える
  if (content.includes("\n• ") || content.includes("\n- ")) {
    return (
      <div className="space-y-1">
        {content.split("\n").map((line, i) =>
          line.startsWith("• ") || line.startsWith("- ") ? (
            <div key={i} className="flex gap-2">
              <span>•</span>
              <span>{line.slice(2)}</span>
            </div>
          ) : (
            <p key={i}>{line}</p>
          )
        )}
      </div>
    );
  }
  return <p>{content}</p>;
}
