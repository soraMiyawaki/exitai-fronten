import { useEffect, useState } from "react";
import { getProfile, getScouts, type Profile as P, type Scout } from "../lib/mock";

export default function Dashboard() {
  const [profile, setProfile] = useState<P | null>(null);
  const [scouts, setScouts] = useState<Scout[]>([]);
  const [tab, setTab] = useState<"all"|"new"|"saved">("all");

  useEffect(() => { getProfile().then(setProfile); getScouts().then(setScouts); }, []);

  const avg = scouts.length ? Math.round(scouts.reduce((a,b)=>a+b.score,0)/scouts.length*100) : 0;

  const filtered = scouts.filter(s => {
    if (tab==="new") return true;     // 今は全部new扱い（将来フラグで分岐）
    if (tab==="saved") return false;  // まだ保存機能なし
    return true;
  });

  return (
    <div className="space-y-6">
      {/* KPI */}
      <section className="grid sm:grid-cols-3 gap-4">
        <div className="stat">
          <div className="label">新着スカウト</div>
          <div className="value">{scouts.length}</div>
          <span className="delta bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">+2 本週</span>
        </div>
        <div className="stat">
          <div className="label">平均適合度</div>
          <div className="value">{avg}%</div>
          <span className="delta bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">↑</span>
        </div>
        <div className="stat">
          <div className="label">保存済み</div>
          <div className="value">0</div>
          <span className="delta bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">—</span>
        </div>
      </section>

      {/* プロフィール */}
      {profile && (
        <section className="card">
          <h3 className="font-semibold mb-2">プロフィール要約</h3>
          <div className="text-sm opacity-80">{profile.name}｜{profile.title}｜{profile.years}年</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.skills.map(s => <span key={s} className="badge">{s}</span>)}
          </div>
        </section>
      )}

      {/* スカウト */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">スカウト一覧</h3>
          <div className="tabs">
            <button className="tab" data-active={tab==="all"} onClick={()=>setTab("all")}>すべて</button>
            <button className="tab" data-active={tab==="new"} onClick={()=>setTab("new")}>新着</button>
            <button className="tab" data-active={tab==="saved"} onClick={()=>setTab("saved")}>保存</button>
          </div>
        </div>
        {filtered.length===0 ? (
          <div className="card">
            <div className="text-sm opacity-70">まだ表示するスカウトがありません。</div>
          </div>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => (
              <li key={s.id} className="card hover:shadow-md transition">
                <div className="text-[13px] opacity-70">{s.receivedAt}</div>
                <div className="mt-0.5 font-medium">{s.title}</div>
                <div className="text-sm opacity-80">@ {s.company}</div>
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" style={{width:`${Math.round(s.score*100)}%`}}/>
                  </div>
                  <div className="text-[12px] mt-1 opacity-70">{Math.round(s.score*100)}%</div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="btn-outline">詳細</button>
                  <button className="btn-primary">保存</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
