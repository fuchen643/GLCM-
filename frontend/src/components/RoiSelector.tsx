import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';

export interface RoiRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface RoiRegion {
  id: string;
  label: string;
  roi: RoiRect;
  color: string;
}

interface Props {
  previewUrl: string;
  width: number;   // 图片自然宽度（px）
  height: number;  // 图片自然高度（px）
  regions: RoiRegion[];
  onAdd: (roi: RoiRect) => void;
  onRemove: (id: string) => void;
}

const MIN_SIZE = 4; // 最小选区（自然像素），过小视为取消

export default function RoiSelector({ previewUrl, width, height, regions, onAdd, onRemove }: Props) {
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
    if (wi >= MIN_SIZE && hi >= MIN_SIZE) onAdd({ x: xi, y: yi, w: wi, h: hi });
  }

  const last = regions[regions.length - 1];

  // 局部放大预览（nearest-neighbor 保持像素感，展示最近框选的区域）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!last) return;
    const roi = last.roi;
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
  }, [last, previewUrl]);

  const pctOf = (r: RoiRect) => ({
    left: (r.x / width) * 100,
    top: (r.y / height) * 100,
    width: (r.w / width) * 100,
    height: (r.h / height) * 100,
  });

  return (
    <div>
      <div
        className="roi-canvas"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { if (dragging.current) { dragging.current = false; start.current = null; setDraft(null); } }}
      >
        <img ref={imgRef} src={previewUrl} alt="预览（拖动框选局部区域）" draggable={false} />
        {regions.map((rg, idx) => {
          const p = pctOf(rg.roi);
          return (
            <div
              key={rg.id}
              className="roi-rect"
              style={{ left: `${p.left}%`, top: `${p.top}%`, width: `${p.width}%`, height: `${p.height}%`, borderColor: rg.color, background: 'transparent' }}
            >
              <span className="roi-tag" style={{ background: rg.color }}>{idx + 1}</span>
            </div>
          );
        })}
        {draft && (() => {
          const p = pctOf(draft);
          return <div className="roi-rect" style={{ left: `${p.left}%`, top: `${p.top}%`, width: `${p.width}%`, height: `${p.height}%` }} />;
        })()}
      </div>

      <div className="roi-zoom">
        <canvas ref={canvasRef} width={240} height={180} />
        <p className="roi-zoom-hint">
          {last
            ? `局部放大：${last.roi.w}×${last.roi.h} @ (${last.roi.x}, ${last.roi.y})`
            : '在预览图上按住鼠标拖动，框选要分析的局部区域（可框选多个）'}
        </p>
      </div>

      {regions.length > 0 && (
        <ul className="roi-list">
          {regions.map((rg, idx) => (
            <li key={rg.id}>
              <span className="roi-list-dot" style={{ background: rg.color }} />
              <span className="roi-list-label">{rg.label}</span>
              <span className="roi-list-meta">{rg.roi.w}×{rg.roi.h}</span>
              <button className="roi-del" onClick={() => onRemove(rg.id)} title={`删除${idx + 1}`}>×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
