import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './AppLayout';
import Dashboard from '../pages/Dashboard';
import CompanyChat from '../pages/CompanyChat';
import AIChat from '../pages/AIChat';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';
import Login from '../pages/Login';
import CompanyHome from '../pages/CompanyHome';

/**
 * ルーティング設定。新たに login と company ページを追加しています。
 */
export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <AppLayout />,
      errorElement: <NotFound />,
      children: [
        { index: true, element: <Dashboard /> },
        { path: 'chat/company', element: <CompanyChat /> },
        { path: 'chat/ai', element: <AIChat /> },
        { path: 'profile', element: <Profile /> },
        { path: 'settings', element: <Settings /> },
        // 企業側のダッシュボード
        { path: 'company', element: <CompanyHome /> },
        // ログインページ
        { path: 'login', element: <Login /> },
        // 全てにマッチしない場合は NotFound
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);