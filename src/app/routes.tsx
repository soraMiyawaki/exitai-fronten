import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './AppLayout';
import AIChat from '../pages/AIChat';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';
import Login from '../pages/Login';

/**
 * ルーティング設定。新たに login と company ページを追加しています。
 */
export const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/',
      element: <AppLayout />,
      errorElement: <NotFound />,
      children: [
        { path: 'chat/ai', element: <AIChat /> },
        { path: 'settings', element: <Settings /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);