import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout";
import Dashboard from "../pages/Dashboard";
import CompanyChat from "../pages/CompanyChat";
import AIChat from "../pages/AIChat";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import NotFound from "../pages/NotFound"; // ★追加

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppLayout />,
      errorElement: <NotFound />,               // ★未処理エラーや未マッチ時のUI
      children: [
        { index: true, element: <Dashboard /> },
        { path: "chat/company", element: <CompanyChat /> },
        { path: "chat/ai", element: <AIChat /> },
        { path: "profile", element: <Profile /> },
        { path: "settings", element: <Settings /> },
        { path: "*", element: <NotFound /> },   // ★キャッチオール
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL }        // GH Pages のサブパス対応
);
