import React, { useState } from "react";
import MarkdownMessage from "./MarkdownMessage";
import { copyToClipboard } from "../lib/copy";

type Props = { content: string };

export default function AssistantBubble({ content }: Props) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="relative max-w-[min(860px,calc(100%-4rem))] rounded-2xl border border-red-100 bg-red-50 text-neutral-900 px-4 py-3 text-sm shadow-sm break-words">
      {/* 全文コピー */}
      <button
        type="button"
        aria-label="回答をコピー"
        onClick={async () => {
          const ok = await copyToClipboard(content);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        className="absolute right-2 top-2 rounded-md border bg-white/80 text-xs px-2 py-1 shadow hover:bg-white"
        title="回答をコピー"
      >
        {copied ? "Copied!" : "Copy"}
      </button>

      {/* 本文（Markdown + コードブロックコピー対応） */}
      <div className="pt-6">
        <MarkdownMessage content={content} />
      </div>
    </div>
  );
}
