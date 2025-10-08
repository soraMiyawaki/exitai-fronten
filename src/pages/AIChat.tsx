// src/pages/AIChat.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { streamChat, ChatApiError } from "../lib/chatApi";
import type { ChatMessage } from "../lib/chatApi";
import AssistantBubble from "../components/AssistantBubble";
import UserMessage from "../components/UserMessage";
import ErrorBanner from "../components/ErrorBanner";
import BranchIndicator from "../components/BranchIndicator";
import { loadPresets, type Preset } from "../lib/presets";
import { exportChat } from "../lib/export";
import { copyToClipboard } from "../lib/copy";
import {
  createConversationTree,
  appendMessage,
  editMessageAndBranch,
  getCurrentMessages,
  getSiblingBranches,
  switchToPath,
  serializeTree,
  deserializeTree,
  type ConversationTree,
} from "../lib/conversationTree";
import { getSessionKeys } from "../lib/session";

const KUMA_STYLE = [
  "出力ルール：すべての文末に必ず『クマ♡』を付けて返答してください。",
  "コード/コマンド/URL/ファイルパス/JSON/表の中には付けないでください。",
  "箇条書きでも各行の最後に付けてください。",
].join("\n");

// Get session-specific storage keys
const STORAGE_KEYS = getSessionKeys();

const CATS = [
  "インフラ/サーバ",
  "ネットワーク",
  "OS/ミドルウェア",
  "開発/CI",
  "クラウド/Azure",
  "セキュリティ",
  "トラブルシュート",
] as const;
type Category = (typeof CATS)[number];

const DEFAULT_SYS = (cat: string) =>
  `あなたは${cat}領域のシステムエンジニアです。要件の聞き返し→前提の明確化→箇条書きの手順→最後に注意点の順で、簡潔かつ正確に答えてください。`;

export default function AIChat() {
  const [conversationTree, setConversationTree] = useState<ConversationTree>(() => createConversationTree());
  const [input, setInput] = useState("");
  const [cat, setCat] = useState<Category>(CATS[0]);
  const [sys, setSys] = useState(DEFAULT_SYS(CATS[0]));
  const [kumaEnabled, setKumaEnabled] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState<ChatApiError | null>(null);
  const [presets] = useState<Preset[]>(loadPresets());
  const [selectedPreset, setSelectedPreset] = useState<string>("custom");
  const [streamSpeed, setStreamSpeed] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const streamStartRef = useRef<number>(0);
  const streamCharsRef = useRef<number>(0);
  const prevMessageCountRef = useRef<number>(0);

  // Get current messages from tree
  const messages = useMemo(() => getCurrentMessages(conversationTree), [conversationTree]);

  // テーマ復元
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  // ツリー復元
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.tree);
      if (raw) {
        setConversationTree(deserializeTree(raw));
      } else {
        // Fallback to old messages format
        const oldMsgs = localStorage.getItem(STORAGE_KEYS.messages);
        if (oldMsgs) {
          const msgs: ChatMessage[] = JSON.parse(oldMsgs);
          let tree = createConversationTree();
          msgs.forEach(msg => {
            tree = appendMessage(tree, msg);
          });
          setConversationTree(tree);
        }
      }
    } catch {
      // LocalStorage access error - ignore
    }
  }, []);

  // ツリー保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.tree, serializeTree(conversationTree));
    // Also save to old format for backwards compatibility
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
  }, [conversationTree, messages]);

  // 自動スクロール
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  // Track previous message count for animation optimization
  useEffect(() => {
    prevMessageCountRef.current = messages.length;
  }, [messages.length]);

  // Stop function (defined before useEffect that uses it)
  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    // 中断時も途中までの回答を保存
    localStorage.setItem(STORAGE_KEYS.tree, serializeTree(conversationTree));
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
  }, [conversationTree, messages]);

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + K: 検索トグル
      if (modKey && e.key === 'k') {
        e.preventDefault();
        setShowSearch(prev => !prev);
      }

      // Cmd/Ctrl + /: 最後のコードブロックをコピー
      if (modKey && e.key === '/') {
        e.preventDefault();
        const lastMsg = messages[messages.length - 1];
        if (lastMsg?.role === 'assistant') {
          const codeMatch = lastMsg.content.match(/```[\s\S]*?```/g);
          if (codeMatch) {
            const lastCode = codeMatch[codeMatch.length - 1];
            const code = lastCode.replace(/```[\w]*\n?/g, '').trim();
            copyToClipboard(code);
          }
        }
      }

      // Esc: 入力クリア or 検索を閉じる or ストップ
      if (e.key === 'Escape') {
        if (isStreaming) {
          abortRef.current?.abort();
          abortRef.current = null;
          setIsStreaming(false);
        } else if (showSearch) {
          setShowSearch(false);
          setSearchQuery("");
        } else if (input) {
          setInput("");
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [messages, isStreaming, showSearch, input]);

  const base: ChatMessage[] = useMemo(
    () =>
      [
        { role: "system" as const, content: sys },
        kumaEnabled ? { role: "system" as const, content: KUMA_STYLE } : null,
      ].filter(Boolean) as ChatMessage[],
    [sys, kumaEnabled]
  );

  const filteredMessages = useMemo(() => {
    return !searchQuery.trim()
      ? messages.map((m, idx) => ({ message: m, originalIndex: idx }))
      : messages
          .map((m, idx) => ({ message: m, originalIndex: idx }))
          .filter(item => item.message.content.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [messages, searchQuery]);

  const sendMessage = (userMessages: ChatMessage[], currentTree: ConversationTree) => {
    setError(null);

    // Add assistant message placeholder to tree
    const tempAssistant: ChatMessage = { role: "assistant", content: "", timestamp: Date.now() };
    const updatedTree = appendMessage(currentTree, tempAssistant);
    setConversationTree(updatedTree);

    setIsStreaming(true);
    streamStartRef.current = Date.now();
    streamCharsRef.current = 0;
    setStreamSpeed(0);

    abortRef.current = streamChat(
      { messages: [...base, ...userMessages], temperature: 0.3, max_tokens: 512 },
      (chunk) => {
        streamCharsRef.current += chunk.length;
        const elapsed = (Date.now() - streamStartRef.current) / 1000;
        if (elapsed > 0) {
          setStreamSpeed(Math.round(streamCharsRef.current / elapsed));
        }

        // Update the last message in the tree
        setConversationTree((prevTree) => {
          const currentPath = prevTree.currentPath;
          const lastNodeId = currentPath[currentPath.length - 1];
          const lastNode = prevTree.nodes.get(lastNodeId);

          if (lastNode && lastNode.message.role === "assistant") {
            // Create new Map to trigger React re-render
            const newNodes = new Map(prevTree.nodes);
            newNodes.set(lastNodeId, {
              ...lastNode,
              message: {
                ...lastNode.message,
                content: lastNode.message.content + chunk,
              },
            });

            return {
              ...prevTree,
              nodes: newNodes,
            };
          }

          return prevTree;
        });
      },
      () => {
        setIsStreaming(false);
        setStreamSpeed(0);
        abortRef.current = null;
      },
      (err) => {
        console.error(err);
        setIsStreaming(false);
        setStreamSpeed(0);
        abortRef.current = null;
        setError(err);
      }
    );
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = { role: "user", content: text, timestamp: Date.now() };
    const updatedTree = appendMessage(conversationTree, userMsg);
    setConversationTree(updatedTree);
    setInput("");
    sendMessage(getCurrentMessages(updatedTree), updatedTree);
  };

  const handleEdit = (index: number, newContent: string) => {
    // 編集した内容で新しい分岐を作成
    const targetMsg = messages[index];
    if (!targetMsg) return;

    // Find the node ID for this message
    const path = conversationTree.currentPath;
    const nodeId = path[index + 1]; // +1 because path[0] is root

    if (nodeId) {
      const updatedTree = editMessageAndBranch(conversationTree, nodeId, newContent);
      setConversationTree(updatedTree);
      sendMessage(getCurrentMessages(updatedTree), updatedTree);
    }
  };

  const handleResend = (index: number) => {
    // 再送信: 指定したメッセージまでのツリーに切り替えて再送信
    const targetPath = conversationTree.currentPath.slice(0, index + 2); // +2 because path[0] is root
    const targetNodeId = targetPath[targetPath.length - 1];
    if (targetNodeId) {
      const updatedTree = switchToPath(conversationTree, targetNodeId);
      setConversationTree(updatedTree);
      sendMessage(getCurrentMessages(updatedTree), updatedTree);
    }
  };

  const newChat = () => {
    if (isStreaming) stop();
    setConversationTree(createConversationTree());
  };

  const toggleDarkMode = () => {
    const newDark = !darkMode;
    setDarkMode(newDark);
    if (newDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem(STORAGE_KEYS.theme, "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem(STORAGE_KEYS.theme, "light");
    }
  };

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-[var(--bg)]">
      <div className="mx-auto flex min-h-dvh w-full max-w-[1200px] flex-col">
        {/* ヘッダー */}
        <header className="sticky top-0 backdrop-blur-sm bg-[var(--bg)]/95 z-10 flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 border-b border-[var(--border)]">
          <div className="text-lg md:text-xl font-semibold">EXIT GPT</div>
          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="category-select" className="sr-only">
              カテゴリ
            </label>
            <select
              id="category-select"
              title="カテゴリ"
              aria-label="カテゴリ"
              value={cat}
              onChange={(e) => {
                const c = e.target.value as Category;
                setCat(c);
                setSys(DEFAULT_SYS(c));
              }}
              className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--fg)] hover:bg-[var(--surface)] focus-visible:ring-2 ring-brand ring-offset-2 transition"
            >
              {CATS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <button
              onClick={toggleDarkMode}
              className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] hover:bg-[var(--surface)] focus-visible:ring-2 ring-brand ring-offset-2 transition"
              title="ダークモード切替"
              aria-label="ダークモード切替"
            >
              {darkMode ? "🌙" : "☀️"}
            </button>

            <button
              onClick={() => setShowSearch(!showSearch)}
              className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] hover:bg-[var(--surface)] focus-visible:ring-2 ring-brand ring-offset-2 transition"
              title="検索"
              aria-label="検索"
            >
              🔍
            </button>

            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] hover:bg-[var(--surface)] focus-visible:ring-2 ring-brand ring-offset-2 transition"
                title="エクスポート"
                aria-label="エクスポート"
                disabled={messages.length === 0}
              >
                📥
              </button>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden z-20"
                >
                  <button
                    onClick={() => {
                      exportChat(messages, "md");
                      setShowExportMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-[var(--surface)] transition"
                  >
                    Markdown
                  </button>
                  <button
                    onClick={() => {
                      exportChat(messages, "json");
                      setShowExportMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-[var(--surface)] transition"
                  >
                    JSON
                  </button>
                </motion.div>
              )}
            </div>

            <button
              onClick={newChat}
              className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] hover:bg-[var(--surface)] focus-visible:ring-2 ring-brand ring-offset-2 transition"
              title="新しいチャットを開始"
              aria-label="新しいチャットを開始"
            >
              新規
            </button>
          </div>
        </header>

        {/* 検索バー */}
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 md:px-6 py-2 border-b border-[var(--border)] bg-[var(--surface)]"
          >
            <input
              type="text"
              placeholder="メッセージを検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus-visible:ring-2 ring-brand ring-offset-2"
              aria-label="メッセージ検索"
            />
            {searchQuery && (
              <p className="text-xs text-[var(--muted)] mt-1">
                {filteredMessages.length}件 / {messages.length}件
              </p>
            )}
          </motion.div>
        )}

        {/* エラーバナー */}
        <ErrorBanner
          error={error}
          onRetry={() => {
            setError(null);
            if (messages.length > 0) {
              handleResend(messages.length - 1);
            }
          }}
          onDismiss={() => setError(null)}
        />

        {/* システムプロンプトバー */}
        <div className="px-4 md:px-6 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-2 mb-1">
            <label htmlFor="sys-prompt" className="block text-xs text-[var(--muted)]">
              システムプロンプト
            </label>
            <select
              id="preset-select"
              title="プリセット選択"
              aria-label="プリセット選択"
              value={selectedPreset}
              onChange={(e) => {
                const presetId = e.target.value;
                setSelectedPreset(presetId);
                const preset = presets.find(p => p.id === presetId);
                if (preset && preset.id !== "custom") {
                  setSys(preset.prompt);
                  const matchingCat = CATS.find(c => c === preset.category);
                  if (matchingCat) setCat(matchingCat);
                }
              }}
              className="text-xs rounded-lg border border-[var(--border)] px-2 py-1 bg-[var(--bg)] text-[var(--fg)] hover:bg-[var(--bg)] focus-visible:ring-2 ring-brand ring-offset-2 transition"
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            id="sys-prompt"
            title="システムプロンプト"
            aria-label="システムプロンプト"
            value={sys}
            onChange={(e) => {
              setSys(e.target.value);
              setSelectedPreset("custom");
            }}
            rows={2}
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--fg)] focus-visible:ring-2 ring-brand ring-offset-2 transition"
          />
          <div className="mt-2 flex items-center gap-2">
            <label htmlFor="kuma-toggle" className="flex items-center gap-2 text-xs text-[var(--muted)] cursor-pointer">
              <input
                id="kuma-toggle"
                type="checkbox"
                checked={kumaEnabled}
                onChange={(e) => setKumaEnabled(e.target.checked)}
                className="rounded border-[var(--border)] text-brand focus:ring-2 focus:ring-brand focus:ring-offset-2"
              />
              クマ語尾モード
            </label>
          </div>
        </div>

        {/* メッセージリスト */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 overscroll-contain"
        >
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-[var(--muted)] text-center mt-8"
            >
              カテゴリを選んで質問を入力してください。
            </motion.div>
          )}
          {filteredMessages.map((item) => {
            const m = item.message;
            const i = item.originalIndex;
            const isUser = m.role === "user";
            // Get branch info for this message
            const nodeId = conversationTree.currentPath[i + 1]; // +1 for root
            const branches = nodeId ? getSiblingBranches(conversationTree, nodeId) : [];
            const hasBranches = branches.length > 0;

            // Only animate new messages (last 2 messages)
            const isNewMessage = i >= prevMessageCountRef.current - 1;
            const shouldAnimate = isNewMessage && messages.length <= 50; // Don't animate if too many messages

            return (
              <motion.div
                key={i}
                initial={shouldAnimate ? { opacity: 0, y: 6 } : { opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={shouldAnimate ? { duration: 0.15 } : { duration: 0 }}
                className={`flex flex-col gap-1 w-full ${isUser ? "items-end" : "items-start"}`}
              >
                {hasBranches && (
                  <BranchIndicator
                    branches={branches}
                    currentIndex={0}
                    onSwitchBranch={(targetNodeId) => {
                      const updatedTree = switchToPath(conversationTree, targetNodeId);
                      setConversationTree(updatedTree);
                    }}
                  />
                )}
                <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
                  {isUser ? (
                    <UserMessage
                      content={m.content || (i === messages.length - 1 && isStreaming ? "…" : "")}
                      timestamp={m.timestamp}
                      onEdit={!isStreaming ? (newContent) => handleEdit(i, newContent) : undefined}
                      onResend={!isStreaming ? () => handleResend(i) : undefined}
                    />
                  ) : (
                    <AssistantBubble
                      content={m.content || (i === messages.length - 1 && isStreaming ? "…" : "")}
                      talking={m.role === "assistant" && i === messages.length - 1 && isStreaming}
                      streamSpeed={m.role === "assistant" && i === messages.length - 1 && isStreaming ? streamSpeed : undefined}
                      timestamp={m.timestamp}
                      reasoning={m.reasoning}
                      reasoningTokens={m.reasoningTokens}
                    />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 入力エリア */}
        <form
          onSubmit={onSubmit}
          className="px-4 md:px-6 py-3 border-t border-[var(--border)] bg-[var(--bg)]"
        >
          <div className="flex items-end gap-2">
            <label htmlFor="chat-input" className="sr-only">
              メッセージ入力
            </label>
            <textarea
              id="chat-input"
              title="メッセージ入力"
              aria-label="メッセージ入力"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="質問を入力…（Shift+Enterで改行）"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
                if (e.key === "/" && input === "") {
                  // 将来的にスラッシュコマンド対応
                }
              }}
              className="flex-1 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus-visible:ring-2 ring-brand ring-offset-2 resize-none transition"
            />
            <button
              type={isStreaming ? "button" : "submit"}
              onClick={isStreaming ? stop : undefined}
              className="rounded-xl px-4 py-3 text-sm font-medium shadow-[0_6px_20px_rgba(0,0,0,0.08)] bg-brand text-white hover:bg-brand-hover focus-visible:ring-2 ring-brand ring-offset-2 transition"
              aria-label={isStreaming ? "停止" : "送信"}
            >
              {isStreaming ? "停止" : "送信"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
