// src/components/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated, isAuthorized, logout } from '../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    isAuthenticated().then(authed => {
      if (!authed) {
        navigate('/login');
        return;
      }

      // 認証済みだが許可リストに含まれているかチェック
      isAuthorized().then(authz => {
        if (!authz) {
          setAuthorized(false);
          setChecking(false);
        } else {
          setAuthorized(true);
          setChecking(false);
        }
      });
    });
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">認証を確認中...</div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
              アクセス拒否
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              このアプリケーションへのアクセス権限がありません
            </p>
          </div>
          <button
            onClick={logout}
            className="w-full px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl transition-colors duration-200"
          >
            ログアウト
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
