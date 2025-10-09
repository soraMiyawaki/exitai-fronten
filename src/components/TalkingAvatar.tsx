// src/components/TalkingAvatar.tsx
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * public 直下に下記2枚を置いてください:
 * - ai-avatar.png        (閉じ口)
 * - ai-avatar-open.png   (開き口)
 * 口パクは active=true の間だけ作動します。
 */
type Props = {
  size?: number;          // 表示サイズ(px)
  active?: boolean;       // 口パクON/OFF
  className?: string;     // 任意の追加クラス
  closedName?: string;    // 画像名（既定: ai-avatar.png）
  openName?: string;      // 画像名（既定: ai-avatar-open.png）
};

export default function TalkingAvatar({
  size = 96,                 // ← 大きめデフォルト
  active = false,
  className = "",
  closedName = "ai-avatar.png",
  openName = "ai-avatar-open.png",
}: Props) {
  const base = import.meta.env.BASE_URL || "/";
  const closedSrc = useMemo(() => `${base}${closedName}`, [base, closedName]);
  const openSrc   = useMemo(() => `${base}${openName}`,   [base, openName]);

  const [hasOpen, setHasOpen] = useState<boolean>(true); // 開口画像が無い/読込失敗なら false
  const [open, setOpen] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // 開口画像を事前ロード（無ければ hasOpen=false）
  useEffect(() => {
    const img = new Image();
    img.onload = () => setHasOpen(true);
    img.onerror = () => setHasOpen(false);
    img.src = openSrc;
  }, [openSrc]);

  // 口パク（ランダムな間隔で開閉）
  useEffect(() => {
    if (!active || !hasOpen) {
      setOpen(false);
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
      return;
    }
    const tick = () => {
      setOpen((v) => !v);
      const next = Math.floor(90 + Math.random() * 140); // 90–230ms
      timerRef.current = window.setTimeout(tick, next);
    };
    tick();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [active, hasOpen]);

  return (
    <div
      className={`relative ${className}`}
      style={{
        width: size,
        height: size,
        // トーク中に揺れる・跳ねるアニメーション
        animation: active ? 'avatar-bounce 0.6s ease-in-out infinite' : 'none',
      }}
      aria-label="AIアバター"
    >
      <style>{`
        @keyframes avatar-bounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-4px) rotate(-2deg); }
          50% { transform: translateY(-2px) rotate(0deg); }
          75% { transform: translateY(-4px) rotate(2deg); }
        }
      `}</style>
      {/* 閉じ口（常に表示） */}
      <img
        src={closedSrc}
        alt=""
        className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
        draggable={false}
      />
      {/* 開き口（上に重ねて不透明度で口パク） */}
      {hasOpen && (
        <img
          src={openSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none"
          style={{
            opacity: open ? 1 : 0,
            transition: "opacity 70ms linear",
            willChange: "opacity",
          }}
          draggable={false}
        />
      )}
    </div>
  );
}
