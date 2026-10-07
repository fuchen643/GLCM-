import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';

export interface RoiRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  previewUrl: string;
  width: number;   // 图片自然宽度（px）
  height: number;  // 图片自然高度（px）
  roi: RoiRect | null;
  onSelect: (roi: RoiRect | null) => void;
}

const MIN_SIZE = 4; // 最小选区（自然像素），过小视为取消

export default function RoiSelector({ previewUrl, width, height, roi, onSelect }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draft, setDraft] = useState<RoiRect | null>(null);
  const dragging = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);

  // 显示坐标 → 图片自然坐标（按当前显示尺寸缩放，适应任意 CSS 缩放）
  function toNatural(e: ReactMouseEvent<HTMLDivElement>) {
    const img = imgRef.current!;
    const rect = img.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    return {
      x: (e.clientX - rect.left) * (width / rect.width),
      y: (e.clientY - rect.top) * (height / rect.height),
    };
  }

  function normalize(a: { x: number; y: number }, b: { x: number; y: number }): RoiRect {
    const x = Math.max(0, Math.min(a.x, b.x));
    const y = Math.max(0, Math.min(a.y, b.y));
    const x2 = Math.min(width, Math.max(a.x, b.x));
    const y2 = Math.min(height, Math.max(a.y, b.y));
    return { x, y, w: x2 - x, h: y2 - y };
  }

  function onMouseDown(e: ReactMouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    dragging.current = true;
    start.current = toNatural(e);
    setDraft({ x: start.current.x, y: start.current.y, w: 0, h: 0 });
  }

  function onMouseMove(e: ReactMouseEvent<HTMLDivElement>) {
    if (!dragging.current || !start.current) return;
    setDraft(normalize(start.current, toNatural(e)));
  }

  function onMouseUp(e: ReactMouseEvent<HTMLDivElement>) {
    if (!dragging.current || !start.current) return;
    dragging.current = false;
    const r = normalize(start.current, toNatural(e));
    start.current = null;
    setDraft(null);
    const xi = Math.round(r.x), yi = Math.round(r.y);
    const wi = Math.round(r.w), hi = Math.round(r.h);
    if (wi >= MIN_SIZE && hi >= MIN_SIZE) onSelect({ x: xi, y: yi, w: wi, h: hi });
    else onSelect(null);
  }

  // 局部放大预览（nearest-neighbor 保持像素感）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!roi) return;
    const img = new Image();
    img.onload = () => {
      ctx.imageSmoothingEnabled = false;
      const cw = canvas.width, ch = canvas.height;
      const scale = Math.min(cw / roi.w, ch / roi.h);
      const dw = Math.max(1, Math.round(roi.w * scale));
      const dh = Math.max(1, Math.round(roi.h * scale));
      const dx = Math.round((cw - dw) / 2);
      const dy = Math.round((ch - dh) / 2);
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, roi.x, roi.y, roi.w, roi.h, dx, dy, dw, dh);
    };
    img.src = previewUrl;
  }, [roi, previewUrl]);

  const shown = draft ?? roi;
  const pct = shown
    ? {
        left: (shown.x / width) * 100,
        top: (shown.y / height) * 100,
        width: (shown.w / width) * 100,
        height: (shown.h / height) * 100,
      }
    : null;

  return (
    <div>
      <div
        className="roi-canvas"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { if (dragging.current) { dragging.current = false; start.current = null; setDraft(null); } }}
      >
        <img ref={imgRef} src={previewUrl} alt="预览（可框选局部）" draggable={false} />
        {pct && (
          <div
            className="roi-rect"
            style={{ left: `${pct.left}%`, top: `${pct.top}%`, width: `${pct.width}%`, height: `${pct.height}%` }}
          />
        )}
      </div>

      <div className="roi-zoom">
        <canvas ref={canvasRef} width={240} height={180} />
        <p className="roi-zoom-hint">
          {roi
            ? `局部放大：${roi.w}×${roi.h} @ (${roi.x}, ${roi.y})`
            : '在预览图上按住鼠标拖动，框选要分析的局部区域'}
        </p>
      </div>
    </div>
  );
}
