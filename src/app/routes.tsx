import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./AppLayout";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import CompanyChat from "../pages/CompanyChat";
import Settings from "../pages/Settings";
import AIChat from "../pages/AIChat";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "chat/company", element: <CompanyChat /> },
      { path: "profile", element: <Profile /> },
      { path: "settings", element: <Settings /> },
      { path: "chat/ai", element: <AIChat /> },
    ],
  },
]);
