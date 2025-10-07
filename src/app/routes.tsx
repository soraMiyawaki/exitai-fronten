import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './AppLayout';
import AIChat from '../pages/AIChat';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';

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
        { path: 'chat/ai', element: <AIChat /> },
        { path: 'profile', element: <Profile /> },
        { path: 'settings', element: <Settings /> },
        // 企業側のダッシュボード


        // 全てにマッチしない場合は NotFound
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);