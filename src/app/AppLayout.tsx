import { Outlet, NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';

// ナビゲーションメニュー。ログインや企業ダッシュボードへのリンクを追加しています。
const nav = [
  { to: '/chat/ai', label: 'AIチャット' },
  { to: '/attendance', label: '勤怠管理' }
];

/**
 * アプリ全体のレイアウトを定義します。ナビゲーションバーとテーマ切替ボタンを含みます。
 * 子コンポーネントは <Outlet /> でレンダリングされます。
 */
export default function AppLayout() {
  // 初期テーマは localStorage またはメディアクエリから取得
  const initialDark = (() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  })();
  const [dark, setDark] = useState(initialDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <>
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          {/* ロゴ */}
          <NavLink to="/" className="text-lg font-bold flex items-center">
            {/* brand image; if not found, hide */}
            <img
              src={`${import.meta.env.BASE_URL}brand.jpg`}
              alt="ブランドロゴ"
              className="h-6 w-6 mr-2"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            ExitGpt&nbsp;AI
          </NavLink>
          {/* デスクトップ用ナビ */ }
          <nav className="hidden lg:flex space-x-4">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  'px-3 py-2 rounded-xl text-sm transition ' +
                  (isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800')
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          {/* テーマ切替ボタン */ }
          <button
            onClick={() => setDark((v) => !v)}
            title="テーマ切替"
            className="icon-btn ml-2"
          >
            {dark ? '🌙' : '☀️'}
          </button>
        </div>
        {/* モバイル用ナビ */ }
        <nav className="lg:hidden overflow-x-auto whitespace-nowrap px-4 py-2">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                'whitespace-nowrap px-3 py-1.5 rounded-xl text-sm transition ' +
                (isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700')
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </>
  );
}