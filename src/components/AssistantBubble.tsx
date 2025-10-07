// src/components/AssistantBubble.tsx
import { useState } from "react";
import MarkdownMessage from "./MarkdownMessage";
import { copyToClipboard, showCopyFallbackHint } from "../lib/copy";
import TalkingAvatar from "./TalkingAvatar";

type Props = {
  content: string;
  talking?: boolean; // ストリーミング中に true を渡す
};

export default function AssistantBubble({ content, talking = false }: Props) {
  const [copied, setCopied] = useState<null | boolean>(null);

  return (
    <div className="flex items-start gap-3">
      {/* 大きいアイコン（枠/切り抜き無し） */}
      <TalkingAvatar size={96} active={talking} className="flex-shrink-0" />

      {/* 吹き出し + 全文コピー */}
      <div className="relative max-w-[min(860px,calc(100%-8.5rem))] rounded-2xl border border-red-100 bg-red-50 text-neutral-900 px-4 py-3 text-sm shadow-sm break-words">
        <button
          type="button"
          aria-label="回答をコピー"
          title="回答をコピー"
          onClick={async () => {
            const ok = await copyToClipboard(content);
            setCopied(ok);
            if (!ok) showCopyFallbackHint();
            setTimeout(() => setCopied(null), 1200);
          }}
          className="absolute right-2 top-2 rounded-md border bg-white/80 text-xs px-2 py-1 shadow hover:bg-white"
        >
          {copied === true ? "Copied!" : copied === false ? "Failed" : "Copy"}
        </button>
        <div className="pt-6">
          <MarkdownMessage content={content} />
        </div>
      </div>
    </div>
  );
}
