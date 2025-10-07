// src/components/AvatarPicker.tsx
import React, { useRef, useState } from "react";
import { fileToDataUrl, resizeImageDataUrl } from "../utils/image";

type Props = {
  open: boolean;
  onClose: () => void;
  value: string | null;
  onChange: (dataUrlOrHttpUrl: string | null) => void;
};

export const AvatarPicker: React.FC<Props> = ({ open, onClose, value, onChange }) => {
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [urlInput, setUrlInput] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  // A11y: label と関連付けるためのID
  const fileInputId = "avatar-file-input";
  const urlInputId = "avatar-url-input";
  const dialogTitleId = "avatar-dialog-title";

  if (!open) return null;

  const applyUrl = async () => {
    if (!urlInput.trim()) return;
    try {
      onChange(urlInput.trim());
      onClose();
    } catch {
      alert("URLの適用に失敗しました");
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.type)) {
      alert("PNG/JPEG/WebP/GIF/SVG を選択してください");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      const resized = await resizeImageDataUrl(dataUrl, 128);
      setPreview(resized);
    } catch {
      alert("画像の読み込み/変換に失敗しました");
    }
  };

  const save = () => {
    onChange(preview ?? null);
    onClose();
  };

  const reset = () => {
    setPreview(null);
    setUrlInput("");
    onChange(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby={dialogTitleId}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-5 shadow-xl">
        <h2 id={dialogTitleId} className="text-lg font-semibold mb-4">AIアバターの変更</h2>

        <div className="grid gap-4">
          <div>
            <label htmlFor={fileInputId} className="block text-sm font-medium mb-1">画像アップロード</label>
            <input
              id={fileInputId}
              name="avatar-file"
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="block w-full text-sm"
              title="アバター画像をアップロード"
            />
            <p className="text-xs text-gray-500 mt-1">※ 画像は128×128程度に縮小し、LocalStorageに保存します</p>
          </div>

          <div>
            <label htmlFor={urlInputId} className="block text-sm font-medium mb-1">画像URLを使用</label>
            <div className="flex gap-2">
              <input
                id={urlInputId}
                name="avatar-url"
                type="url"
                className="flex-1 rounded-md border px-3 py-2 text-sm"
                placeholder="https://example.com/avatar.png"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
              <button onClick={applyUrl} className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">
                適用
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">プレビュー</label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16">
                {preview ? (
                  <img
                    src={preview}
                    alt="アバターのプレビュー"
                    title="アバターのプレビュー"
                    className="w-16 h-16 rounded-full object-cover ring-1 ring-red-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full ring-1 ring-gray-200 bg-gray-100" />
                )}
              </div>
              <div className="ml-auto flex gap-2">
                <button onClick={reset} className="rounded-md border px-3 py-2 text-sm">デフォルト</button>
                <button onClick={save} className="rounded-md bg-red-600 text-white px-3 py-2 text-sm hover:bg-red-700">保存</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
