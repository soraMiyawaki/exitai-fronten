// src/components/ThinkingProcess.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  reasoning: string;
  thinkingTime?: number; // seconds
};

export default function ThinkingProcess({ reasoning, thinkingTime }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!reasoning) return null;

  return (
    <div className="mb-3 rounded-lg border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-purple-100 dark:hover:bg-purple-900/20 transition"
        aria-expanded={isExpanded}
        aria-label="思考プロセスを表示"
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-purple-600 dark:text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <span className="text-sm font-medium text-purple-900 dark:text-purple-200">
            思考プロセス
          </span>
          {thinkingTime && (
            <span className="text-xs text-purple-600 dark:text-purple-400 font-mono">
              ({thinkingTime}秒)
            </span>
          )}
        </div>
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4 text-purple-600 dark:text-purple-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 border-t border-purple-200 dark:border-purple-900 bg-white dark:bg-purple-950/20">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  {reasoning}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
