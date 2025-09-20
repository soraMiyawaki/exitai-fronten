import { useEffect, useState } from "react";
import { getProfile, saveProfile, type Profile as P } from "../Iib/mock";

export default function Profile() {
  const [form, setForm] = useState<P>({ name: "", title: "", years: 1, skills: [] });
  const [msg, setMsg] = useState("");

  useEffect(() => { getProfile().then(setForm); }, []);
  const onChange = <K extends keyof P>(k: K, v: P[K]) => setForm((p) => ({ ...p, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile(form);
    setMsg("保存しました");
    setTimeout(() => setMsg(""), 1500);
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 backdrop-blur p-5 space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <label className="block">
          <div className="text-sm mb-1">名前</div>
          <input className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white/80 dark:bg-slate-950/40"
                 value={form.name} onChange={(e) => onChange("name", e.target.value)} />
        </label>
        <label className="block">
          <div className="text-sm mb-1">肩書き / タイトル</div>
          <input className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white/80 dark:bg-slate-950/40"
                 value={form.title} onChange={(e) => onChange("title", e.target.value)} />
        </label>
        <label className="block">
          <div className="text-sm mb-1">経験年数</div>
          <input type="number" min={0} className="w-40 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white/80 dark:bg-slate-950/40"
                 value={form.years} onChange={(e) => onChange("years", Number(e.target.value))} />
        </label>
        <label className="block md:col-span-2">
          <div className="text-sm mb-1">スキル（カンマ区切り）</div>
          <input className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white/80 dark:bg-slate-950/40"
                 value={form.skills.join(", ")} onChange={(e) => onChange("skills", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900">保存</button>
        {msg && <span className="text-green-700 dark:text-emerald-400 text-sm">{msg}</span>}
      </div>
    </form>
  );
}
