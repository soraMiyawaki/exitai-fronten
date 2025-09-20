// 変更前（抜粋）: デスクトップ用ナビ
// <nav className="hidden lg:flex items-center gap-1"> ... </nav>

import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

const nav = [
  { to: "/", label: "ホーム" },
  { to: "/chat/company", label: "会話（企業）" },
  { to: "/chat/ai", label: "会話（AI）" },
  { to: "/profile", label: "プロフィール" },
  { to: "/settings", label: "設定" },
];

export default function AppLayout() {
  const initialDark = (() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  })();
  const [dark, setDark] = useState(initialDark);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  const { pathname } = useLocation();
  const title = useMemo(() => nav.find(n => n.to === pathname)?.label ?? "ホーム", [pathname]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/70 backdrop-blur border-b border-slate-200/70 dark:border-slate-800/60">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center gap-4">
          {/* 左：ロゴ */}
          <div className="flex items-center gap-2">
            <img
              src={`${import.meta.env.BASE_URL}brand.jpg`}
              alt="Recul AI"
              className="h-8 w-8 rounded-xl object-cover bg-white ring-1 ring-slate-200 dark:ring-slate-800"
            />
            <span className="font-semibold tracking-tight gtext">ExitGpt&nbsp;AI</span>
          </div>

          {/* 中央：検索（md以上で表示） */}
          <div className="hidden md:flex items-center flex-1 mx-4">
            <div className="flex items-center gap-2 w-full glass rounded-2xl px-3 py-2">
              <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-70">
                <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5A6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79L20 21.5L21.5 20zM4 9.5C4 6.46 6.46 4 9.5 4S15 6.46 15 9.5S12.54 15 9.5 15S4 12.54 4 9.5"/>
              </svg>
              <input placeholder="検索（例：スカウト / 会社名）" className="bg-transparent outline-none flex-1 text-sm" />
              <kbd className="text-[11px] opacity-60">/</kbd>
            </div>
          </div>

          {/* 右：テーマ切替＋アバター */}
          <div className="ml-auto flex items-center gap-2">
            <button className="icon-btn" onClick={() => setDark(v => !v)} title="テーマ切替">
              {dark ? (
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M21 12.79A9 9 0 0 1 11.21 3A7 7 0 1 0 21 12.79"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24"><path fill="currentColor" d="M6.76 4.84l-1.8-1.79l-1.41 1.41l1.79 1.8l1.42-1.42M1 13h3v-2H1v2m10-9h-2v3h2V4m7.66 2.46l1.79-1.8l-1.41-1.41l-1.8 1.79l1.42 1.42M17 11h-3v2h3v-2m-5 7h-2v3h2v-3m6.24-1.84l1.8 1.79l1.41-1.41l-1.79-1.8l-1.42 1.42M20 13h3v-2h-3v2M4.22 19.78l1.42-1.42l-1.8-1.79l-1.41 1.41l1.79 1.8Z"/></svg>
              )}
            </button>

            {/* デスクトップ用ナビ（lg以上で表示） */}
            <nav className="hidden lg:flex items-center gap-1">
              {nav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    "px-3 py-2 rounded-xl text-sm transition " +
                    (isActive
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>

            <img
              src={`${import.meta.env.BASE_URL}brand.jpg`}
              alt="me"
              className="hidden md:block h-9 w-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-800"
            />
          </div>
        </div>

        {/* ▼ モバイル用タブバー（横スクロール）。lg未満で表示 */}
        <div className="lg:hidden border-t border-slate-200/70 dark:border-slate-800/60">
          <div className="mx-auto max-w-6xl px-2 py-2 overflow-x-auto no-scrollbar">
            <div className="flex gap-2">
              {nav.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) =>
                    "whitespace-nowrap px-3 py-1.5 rounded-xl text-sm transition " +
                    (isActive
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                      : "text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700")
                  }
                >
                  {n.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
        {/* ▲ モバイル用タブバー */}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-xl font-semibold tracking-tight mb-4">{title}</h1>
        <Outlet />
      </main>
    </div>
  );
}
