import { useRef, useState, type DragEvent, type ClipboardEvent } from 'react';
import { rgbaToGray } from '../glcm';

interface Props {
  onImage: (gray: Uint8Array, width: number, height: number, previewUrl: string, name: string) => void;
}

export default function ImageUpload({ onImage }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const gray = rgbaToGray(data.data, canvas.width, canvas.height);
      onImage(gray, canvas.width, canvas.height, url, file.name.replace(/\.[^.]+$/, ''));
      setError(null);
    };
    img.onerror = () => setError('图片解码失败');
    img.src = url;
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function onPaste(e: ClipboardEvent) {
    const f = e.clipboardData?.files?.[0];
    if (f) handleFile(f);
  }

  return (
    <div
      className={`upload${dragging ? ' dragging' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onPaste={onPaste}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
      <svg className="upload-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16V4m0 0l-4 4m4-4l4 4" />
        <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
      <p className="upload-text">点击选择图片，或拖拽 / 粘贴到此处</p>
      <button type="button" className="btn-primary" onClick={() => inputRef.current?.click()}>选择图片</button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
