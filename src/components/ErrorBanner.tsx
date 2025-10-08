// src/components/ErrorBanner.tsx
import { motion, AnimatePresence } from "framer-motion";
import { ChatApiError } from "../lib/chatApi";

type Props = {
  error: ChatApiError | null;
  onRetry?: () => void;
  onDismiss: () => void;
};

export default function ErrorBanner({ error, onRetry, onDismiss }: Props) {
  if (!error) return null;

  const getIcon = () => {
    switch (error.code) {
      case 'NETWORK': return '🌐';
      case 'AUTH': return '🔒';
      case 'RATE_LIMIT': return '⏱️';
      case 'SERVER': return '⚠️';
      case 'TIMEOUT': return '⏰';
      default: return '❌';
    }
  };

  const getBgColor = () => {
    switch (error.code) {
      case 'AUTH': return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'RATE_LIMIT': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default: return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`mx-4 md:mx-6 mt-2 mb-2 rounded-xl border px-4 py-3 ${getBgColor()}`}
      >
        <div className="flex items-start gap-3">
          <span className="text-lg flex-shrink-0">{getIcon()}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {error.message}
            </p>
            {error.status > 0 && (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                ステータスコード: {error.status}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {error.canRetry && onRetry && (
              <button
                onClick={onRetry}
                className="text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                aria-label="再試行"
              >
                再試行
              </button>
            )}
            <button
              onClick={onDismiss}
              className="text-xs px-2 py-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800/50 transition"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
