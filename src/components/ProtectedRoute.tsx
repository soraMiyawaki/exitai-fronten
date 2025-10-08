// src/components/ProtectedRoute.tsx
import { useEffect, useState } from 'react';
import { isAuthenticated, redirectToLogin } from '../lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    isAuthenticated().then(authed => {
      if (!authed) {
        redirectToLogin();
      } else {
        setChecking(false);
      }
    });
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">認証を確認中...</div>
      </div>
    );
  }

  return <>{children}</>;
}
