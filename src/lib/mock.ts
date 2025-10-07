import type { Profile } from "./types";
export type { Profile }; // 外にも同じ型を再エクスポート

// 既存の getProfile/saveProfile があれば、その戻り値/引数を Profile に
export async function getProfile(): Promise<Profile> {
  const raw = localStorage.getItem("mock.profile");
  if (!raw) return { name: "未設定", email: "", avatarUrl: "" }; // デフォルトも用意
  try { return JSON.parse(raw) as Profile; } catch { return { name: "未設定", email: "" }; }
}

export async function saveProfile(p: Profile): Promise<void> {
  localStorage.setItem("mock.profile", JSON.stringify(p));
}
