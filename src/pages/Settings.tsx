import { useState } from "react";

export default function Settings() {
  const [val, setVal] = useState(localStorage.getItem("apiKey") || "");
  const [msg, setMsg] = useState("");

  const save = () => {
    localStorage.setItem("apiKey", val.trim());
    setMsg("保存しました（現在は未使用・将来の連携用）");
    setTimeout(() => setMsg(""), 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-5 space-y-3 max-w-xl">
      <h2 className="font-semibold">API Key</h2>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="prefix.secret"
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white/80 dark:bg-slate-950/40"
      />
      <button onClick={save} className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">
        保存
      </button>
      {msg && <div className="text-sm text-emerald-600 dark:text-emerald-400">{msg}</div>}
    </div>
  );
}
