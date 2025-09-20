import { useEffect, useRef, useState } from "react";
import { getCompanyConversation, sendCompanyMessage, type ChatMsg } from "../Iib/mock";

export default function CompanyChat() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { getCompanyConversation().then(setMsgs); }, []);
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    const t = text.trim();
    if (!t) return;
    const m = await sendCompanyMessage(t);
    setMsgs((prev) => [...prev, m]);
    setText("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-4">
      <div className="h-[60vh] overflow-auto" ref={listRef}>
        <div className="space-y-2">
          {msgs.map((m) => (
            <div key={m.id} className={`flex ${m.author === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={
                  "max-w-[75%] rounded-2xl px-3 py-2 shadow-sm " +
                  (m.author === "user"
                    ? "bg-gradient-to-tr from-indigo-500 via-sky-500 to-emerald-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800")
                }>
                <div className="text-sm">{m.text}</div>
                <div className="text-[11px] opacity-70 mt-0.5">{new Date(m.ts).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          placeholder="メッセージを入力…（Enterで送信）"
          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-950/40 px-3 py-2 outline-none focus:ring-2 focus:ring-sky-400/40"
        />
        <button onClick={send} className="px-4 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
          送信
        </button>
      </div>
    </div>
  );
}
