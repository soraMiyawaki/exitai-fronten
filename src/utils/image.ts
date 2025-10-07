// src/utils/image.ts
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export async function resizeImageDataUrl(
  dataUrl: string,
  maxSize = 128,
  preferPng = false,
  jpegQuality = 0.9
): Promise<string> {
  const img = document.createElement("img");
  img.crossOrigin = "anonymous";
  img.decoding = "async";
  await new Promise((res, rej) => {
    img.onload = () => res(null);
    img.onerror = () => rej(new Error("Failed to load image"));
    img.src = dataUrl;
  });

  const { width, height } = img;
  const scale = Math.min(maxSize / Math.max(width, height), 1);
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);

  const isPng = preferPng || dataUrl.startsWith("data:image/png");
  return canvas.toDataURL(isPng ? "image/png" : "image/jpeg", jpegQuality);
}
