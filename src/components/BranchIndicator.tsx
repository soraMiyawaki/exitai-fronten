// src/components/BranchIndicator.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ConversationBranch } from "../lib/conversationTree";

type Props = {
  branches: ConversationBranch[];
  currentIndex: number;
  onSwitchBranch: (nodeId: string) => void;
};

export default function BranchIndicator({ branches, currentIndex, onSwitchBranch }: Props) {
  const [showMenu, setShowMenu] = useState(false);

  if (branches.length === 0) return null;

  const totalBranches = branches.length + 1; // +1 for current branch

  return (
    <div className="relative inline-flex items-center gap-2">
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-1.5 px-2 py-1 text-xs rounded-md border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900 transition"
        title="他の分岐を表示"
        aria-label={`${totalBranches}個の分岐があります`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01" />
        </svg>
        <span className="font-mono">
          {currentIndex + 1}/{totalBranches}
        </span>
      </button>

      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-1 z-50 min-w-[280px] max-w-[400px] rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden"
            >
              <div className="px-3 py-2 bg-[var(--bg)] border-b border-[var(--border)]">
                <h3 className="text-xs font-semibold text-[var(--fg)]">会話の分岐</h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {currentIndex === 0 && (
                  <div className="px-3 py-2 bg-brand/10 border-l-2 border-brand">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-brand">● 現在</span>
                    </div>
                  </div>
                )}
                {branches.map((branch, idx) => {
                  const isActive = idx + 1 === currentIndex;
                  return (
                    <button
                      key={branch.nodeId}
                      type="button"
                      onClick={() => {
                        onSwitchBranch(branch.nodeId);
                        setShowMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-[var(--bg)] transition border-l-2 ${
                        isActive
                          ? "bg-brand/10 border-brand"
                          : "border-transparent"
                      }`}
                    >
                      {isActive && (
                        <div className="font-mono text-brand mb-1">● 現在</div>
                      )}
                      <div className="text-[var(--fg)] line-clamp-2">{branch.preview}</div>
                      <div className="text-[var(--fg-muted)] mt-1">
                        {new Date(branch.timestamp).toLocaleString("ja-JP", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
