// src/components/MarkdownMessage.tsx
import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { copyToClipboard, showCopyFallbackHint } from "../lib/copy";
import "highlight.js/styles/github.css";

const CodeBlock: React.FC<any> = ({ inline, className, children, ...props }) => {
  const code = useMemo(() => String(children ?? ""), [children]);
  const [copied, setCopied] = useState<null | boolean>(null);

  if (inline) {
    return (
      <code className="px-1 py-0.5 rounded bg-neutral-100" {...props}>
        {children}
      </code>
    );
  }

  const lang = (className || "").replace("language-", "");

  return (
    <div className="relative group">
      <button
        type="button"
        aria-label="コードをコピー"
        title="コードをコピー"
        onClick={async () => {
          const ok = await copyToClipboard(code);
          setCopied(ok);
          if (!ok) showCopyFallbackHint();
          setTimeout(() => setCopied(null), 1200);
        }}
        className="absolute right-2 top-2 rounded-md border bg-white/80 text-xs px-2 py-1 shadow hover:bg-white opacity-0 group-hover:opacity-100 transition"
      >
        {copied === true ? "Copied!" : copied === false ? "Failed" : "Copy"}
      </button>
      <pre className="rounded-lg border bg-white overflow-x-auto">
        <code className={className} data-lang={lang} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
};

export default function MarkdownMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{ code: CodeBlock as any }}
    >
      {content}
    </ReactMarkdown>
  );
}
