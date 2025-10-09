import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './AppLayout';
import AIChat from '../pages/AIChat';
import Settings from '../pages/Settings';
import Attendance from '../pages/Attendance';
import NotFound from '../pages/NotFound';
import Login from '../pages/Login';
import { ProtectedRoute } from '../components/ProtectedRoute';

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
      element: (
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      ),
      errorElement: <NotFound />,
      children: [
        { index: true, element: <Navigate to="/chat/ai" replace /> },
        { path: 'chat/ai', element: <AIChat /> },
        { path: 'attendance', element: <Attendance /> },
        { path: 'settings', element: <Settings /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ],
  {
    basename: import.meta.env.BASE_URL,
  }
);