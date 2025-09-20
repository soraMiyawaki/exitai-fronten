// src/lib/mock.ts
export type Scout = { id: number; company: string; title: string; score: number; receivedAt: string };
export type Profile = { name: string; title: string; years: number; skills: string[]; summary?: string };
export type ChatMsg = { id: string; author: "user" | "company"; text: string; ts: string };

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms));

const DEFAULT_PROFILE: Profile = {
  name: "かなこ",
  title: "フルスタック（PySpark/React）",
  years: 1,
  skills: ["Python", "PySpark", "SQL", "React", "FastAPI"],
  summary: "データ基盤〜フロントまでフルレンジ対応。",
};

export async function getProfile(): Promise<Profile> {
  await delay();
  const raw = localStorage.getItem("profile");
  return raw ? (JSON.parse(raw) as Profile) : DEFAULT_PROFILE;
}

export async function saveProfile(p: Profile): Promise<void> {
  localStorage.setItem("profile", JSON.stringify(p));
  await delay(200);
}

export async function getScouts(): Promise<Scout[]> {
  await delay();
  return [
    { id: 1001, company: "Acme Corp",   title: "データエンジニア",  score: 0.86, receivedAt: "2025-09-15" },
    { id: 1002, company: "Foobar Inc.", title: "フロントエンド",    score: 0.78, receivedAt: "2025-09-18" },
    { id: 1003, company: "Globex",      title: "MLエンジニア",      score: 0.73, receivedAt: "2025-09-20" },
  ];
}

const CHAT_KEY = "company_chat";

export async function getCompanyConversation(): Promise<ChatMsg[]> {
  await delay();
  const raw = localStorage.getItem(CHAT_KEY);
  if (raw) return JSON.parse(raw) as ChatMsg[];
  const seed: ChatMsg[] = [
    { id: "m1", author: "company", text: "ご経験に興味があります。面談いかがでしょうか？", ts: "2025-09-18T10:00:00+09:00" },
    { id: "m2", author: "user",    text: "ありがとうございます。役割詳細を教えてください。", ts: "2025-09-18T10:05:00+09:00" },
  ];
  localStorage.setItem(CHAT_KEY, JSON.stringify(seed));
  return seed;
}

export async function sendCompanyMessage(text: string): Promise<ChatMsg> {
  const msg: ChatMsg = { id: crypto.randomUUID(), author: "user", text, ts: new Date().toISOString() };
  const conv = await getCompanyConversation();
  const next = [...conv, msg];
  localStorage.setItem(CHAT_KEY, JSON.stringify(next));
  await delay(150);
  return msg;
}
