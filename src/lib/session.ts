// src/lib/session.ts

const SESSION_ID_KEY = "exitai.sessionId";

/**
 * Generate a unique session ID for this browser tab/window
 * Each tab gets its own session, allowing multiple independent chats
 */
export function getOrCreateSessionId(): string {
  // Check sessionStorage first (unique per tab)
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);

  if (!sessionId) {
    // Generate new session ID
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Get storage keys scoped to the current session
 */
export function getSessionKeys() {
  const sessionId = getOrCreateSessionId();
  return {
    messages: `exitai.${sessionId}.messages`,
    tree: `exitai.${sessionId}.conversationTree`,
    theme: `exitai.theme`, // Theme is global across all sessions
    tts: `exitai.tts`, // TTS is global across all sessions
  };
}

/**
 * List all sessions stored in localStorage
 */
export function listSessions(): Array<{ id: string; lastModified: number; messageCount: number }> {
  const sessions: Array<{ id: string; lastModified: number; messageCount: number }> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("exitai.session_") && key.endsWith(".conversationTree")) {
      const sessionId = key.replace("exitai.", "").replace(".conversationTree", "");
      try {
        const treeData = localStorage.getItem(key);
        if (treeData) {
          const tree = JSON.parse(treeData);
          const messageCount = tree.currentPath?.length - 1 || 0; // -1 for root node
          sessions.push({
            id: sessionId,
            lastModified: tree.lastModified || 0,
            messageCount,
          });
        }
      } catch {
        // Skip invalid sessions
      }
    }
  }

  return sessions.sort((a, b) => b.lastModified - a.lastModified);
}

/**
 * Delete a specific session from localStorage
 */
export function deleteSession(sessionId: string): void {
  localStorage.removeItem(`exitai.${sessionId}.messages`);
  localStorage.removeItem(`exitai.${sessionId}.conversationTree`);
}

/**
 * Create a new session and switch to it
 */
export function createNewSession(): string {
  sessionStorage.removeItem(SESSION_ID_KEY);
  return getOrCreateSessionId();
}
