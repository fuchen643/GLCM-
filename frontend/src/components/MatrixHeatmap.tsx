import { forwardRef, useEffect, useRef, useState, type MouseEvent } from 'react';
import { colormapAt, type ColormapId } from '../colormaps';

interface Props {
  matrix: number[][];
  title?: string;
  colormap?: ColormapId;
}

const CELL = 12;          // 每格像素
const LEGEND_W = 64;      // 图例宽度
const PAD = 34;           // 画布内边距

const MatrixHeatmap = forwardRef<HTMLCanvasElement, Props>(function MatrixHeatmap({ matrix, title, colormap = 'viridis' }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hover, setHover] = useState<{ i: number; j: number; v: number } | null>(null);
  const n = matrix.length;
  const size = PAD * 2 + n * CELL;
  const height = Math.max(size, 180);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let max = 0;
    for (const row of matrix) for (const v of row) if (v > max) max = v;
    if (max === 0) max = 1;

    // 矩阵格
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const [r, g, b] = colormapAt(colormap, matrix[i][j] / max);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(PAD + j * CELL, PAD + i * CELL, CELL, CELL);
      }
    }

    // 坐标轴标签
    ctx.fillStyle = '#888';
    ctx.font = '10px sans-serif';
    ctx.fillText('灰度 i', PAD + (n * CELL) / 2 - 16, PAD - 8);
    ctx.save();
    ctx.translate(12, PAD + (n * CELL) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('灰度 j', 0, 0);
    ctx.restore();

    // 颜色条图例（右侧）
    const lx = PAD + n * CELL + 14;
    const ly = PAD;
    const lh = n * CELL;
    const grad = ctx.createLinearGradient(0, ly, 0, ly + lh);
    for (let s = 0; s <= 1; s += 0.05) {
      const [r, g, b] = colormapAt(colormap, s);
      grad.addColorStop(s, `rgb(${r},${g},${b})`);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(lx, ly, 14, lh);
    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(lx, ly, 14, lh);
    ctx.fillStyle = '#555';
    ctx.font = '10px sans-serif';
    ctx.fillText(max.toExponential(2), lx + 18, ly + 10);   // 顶端 = max
    ctx.fillText('0', lx + 18, ly + lh);                    // 底端 = 0

    // 图例标签（左竖排）
    ctx.save();
    ctx.translate(lx - 6, ly + lh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#555';
    ctx.fillText('概率 P(i,j)', 0, 0);
    ctx.restore();
    ctx.textAlign = 'start';
  }, [matrix, colormap]);

  function onMove(e: MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    const j = Math.floor((x - PAD) / CELL);
    const i = Math.floor((y - PAD) / CELL);
    if (i >= 0 && i < n && j >= 0 && j < n) {
      setHover({ i, j, v: matrix[i][j] });
    } else {
      setHover(null);
    }
  }

  function setRefs(el: HTMLCanvasElement | null) {
    canvasRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  }

  return (
    <section className="heatmap">
      {title && <h3>{title}</h3>}
      <canvas
        ref={setRefs}
        width={PAD * 2 + n * CELL + LEGEND_W}
        height={height}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      />
      <p className="heatmap-readout">
        {hover
          ? `灰度 ${hover.i} → ${hover.j}：P(${hover.i}, ${hover.j}) = ${hover.v.toExponential(4)}`
          : '悬停矩阵查看灰度对概率'}
      </p>
    </section>
  );
});

export default MatrixHeatmap;
