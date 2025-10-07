// src/lib/copy.ts
/**
 * 文字列をクリップボードへコピー（HTTPS or localhost で動作）
 * 成功: true / 失敗: false を返す
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    console.warn("[copy] navigator.clipboard failed:", e);
  }

  // フォールバック
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.style.opacity = "0";
    document.body.appendChild(ta);

    ta.focus();
    ta.select();

    // 念のため Selection API
    const range = document.createRange();
    range.selectNodeContents(ta);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    const ok = document.execCommand("copy");

    sel?.removeAllRanges();
    document.body.removeChild(ta);

    return ok;
  } catch (e) {
    console.warn("[copy] execCommand failed:", e);
  }
  return false;
}

export function showCopyFallbackHint() {
  alert(
    "コピーに失敗しました。https（または localhost）で開いて、もう一度お試しください。必要なら Ctrl+C / ⌘+C でもコピーできます。"
  );
}
