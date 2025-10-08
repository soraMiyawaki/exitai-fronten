// src/components/Avatar.tsx
import React from "react";

type Props = {
  src?: string | null;
  size?: number; // px
  alt?: string;
  color?: "red" | "black" | "gray";
};

const DefaultSvg: React.FC<{ color?: string }> = ({ color = "currentColor" }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-full h-full" fill={color}>
    <circle cx="12" cy="8" r="5" />
    <rect x="4" y="14" width="16" height="8" rx="4" />
  </svg>
);

export const Avatar: React.FC<Props> = ({ src, size = 32, alt = "avatar", color = "red" }) => {
  const ring =
    color === "red" ? "ring-red-200" : color === "black" ? "ring-neutral-300" : "ring-gray-200";
  const bg =
    color === "red"
      ? "bg-red-500/10 text-red-600"
      : color === "black"
      ? "bg-black/5 text-black"
      : "bg-gray-500/10 text-gray-600";
  return (
    <div
      className={`rounded-full overflow-hidden ${bg} flex items-center justify-center ring-1 ${ring}`}
      style={{ width: size, height: size }}
      aria-label={alt}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" crossOrigin="anonymous" draggable={false} />
      ) : (
        <DefaultSvg />
      )}
    </div>
  );
};
