// src/lib/conversationApi.ts
import type { ConversationTree } from "./conversationTree";

const API_BASE = import.meta.env.VITE_API_BASE !== undefined
  ? import.meta.env.VITE_API_BASE
  : "http://127.0.0.1:8000";

export interface SavedConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  conversation_tree?: ConversationTree;
}

/**
 * 会話を保存
 */
export async function saveConversation(
  conversationId: string,
  conversationTree: ConversationTree,
  title?: string
): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/conversations/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: conversationId,
        conversation_tree: conversationTree,
        title,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("[Conversation API] Save error:", error);
    return false;
  }
}

/**
 * 会話一覧を取得
 */
export async function listConversations(): Promise<SavedConversation[]> {
  try {
    const response = await fetch(`${API_BASE}/api/conversations/list`);

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error("[Conversation API] List error:", error);
    return [];
  }
}

/**
 * 会話を取得
 */
export async function getConversation(conversationId: string): Promise<SavedConversation | null> {
  try {
    const response = await fetch(`${API_BASE}/api/conversations/${conversationId}`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("[Conversation API] Get error:", error);
    return null;
  }
}

/**
 * 会話を削除
 */
export async function deleteConversation(conversationId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/conversations/${conversationId}`, {
      method: "DELETE",
    });

    return response.ok;
  } catch (error) {
    console.error("[Conversation API] Delete error:", error);
    return false;
  }
}
