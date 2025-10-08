// src/components/UserMessage.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { formatRelativeTime } from "../lib/time";

type Props = {
  content: string;
  timestamp?: number;
  onEdit?: (newContent: string) => void;
  onResend?: () => void;
};

const UserMessage = React.memo(({ content, timestamp, onEdit, onResend }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(content);
  const [showActions, setShowActions] = useState(false);

  const handleSave = () => {
    if (editText.trim() && editText !== content) {
      onEdit?.(editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(content);
    setIsEditing(false);
  };

  return (
    <div
      className="max-w-[min(860px,calc(100%-4rem))] relative group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {isEditing ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3"
        >
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm bg-[var(--bg)] text-[var(--fg)] focus:outline-none focus-visible:ring-2 ring-brand ring-offset-2 resize-none"
            rows={3}
            autoFocus
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={handleSave}
              className="text-xs px-3 py-1.5 rounded-lg bg-brand text-white hover:bg-brand-hover transition"
            >
              保存して再送信
            </button>
            <button
              onClick={handleCancel}
              className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--surface)] transition"
            >
              キャンセル
            </button>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="whitespace-pre-wrap leading-relaxed rounded-2xl px-4 py-3 text-sm shadow-[0_6px_20px_rgba(0,0,0,0.08)] bg-black dark:bg-neutral-800 text-white">
            {content}
            {timestamp && (
              <div className="text-xs opacity-60 mt-2 text-right">
                {formatRelativeTime(timestamp)}
              </div>
            )}
          </div>
          {showActions && (onEdit || onResend) && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-8 right-0 flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-2 py-1 shadow-sm"
            >
              {onEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs px-2 py-1 rounded hover:bg-[var(--bg)] transition"
                  title="編集して再送信"
                  aria-label="編集して再送信"
                >
                  ✏️ 編集
                </button>
              )}
              {onResend && (
                <button
                  onClick={onResend}
                  className="text-xs px-2 py-1 rounded hover:bg-[var(--bg)] transition"
                  title="再送信"
                  aria-label="再送信"
                >
                  🔄 再送
                </button>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
});

UserMessage.displayName = 'UserMessage';

export default UserMessage;
