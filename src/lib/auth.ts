// src/lib/auth.ts

interface ClientPrincipal {
  identityProvider: string;
  userId: string;
  userDetails: string;
  userRoles: string[];
}

interface AuthResponse {
  clientPrincipal: ClientPrincipal | null;
}

/**
 * Get current authenticated user info
 */
export async function getCurrentUser(): Promise<ClientPrincipal | null> {
  try {
    const response = await fetch("/.auth/me");
    console.log("Auth check - status:", response.status);
    if (!response.ok) {
      console.log("Auth check - not ok");
      return null;
    }

    const data: AuthResponse = await response.json();
    console.log("Auth check - data:", data);
    return data.clientPrincipal;
  } catch (error) {
    console.log("Auth check - error:", error);
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  // Development mode: skip authentication
  if (import.meta.env.DEV) {
    return true;
  }

  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Check if user is authorized (in the allowlist)
 */
export async function isAuthorized(): Promise<boolean> {
  // Development mode: skip authorization
  if (import.meta.env.DEV) {
    return true;
  }

  const user = await getCurrentUser();
  if (!user) return false;

  // 許可するGitHubユーザー名のリスト
  const ALLOWED_USERS = [
    "soraMiyawaki",
    "ET-Asako",
    "izt01",
    "ET-Nakagawa",
    "ET-Ayuzawa",
    "ET-Arai",
    "ET-Sugiura"
  ];

  return ALLOWED_USERS.includes(user.userDetails);
}

/**
 * Redirect to login page
 */
export function redirectToLogin(returnUrl: string = window.location.pathname) {
  window.location.href = `/.auth/login/github?post_login_redirect_uri=${encodeURIComponent(returnUrl)}`;
}

/**
 * Redirect to logout
 */
export function logout() {
  window.location.href = "/.auth/logout";
}
