import { forwardRef, useEffect, useRef } from 'react';

interface Props {
  matrix: number[][];
  title?: string;
}

const CELL = 12;          // 每格像素
const LEGEND_W = 44;      // 图例宽度
const PAD = 32;           // 画布内边距

function colorMap(t: number): [number, number, number] {
  // 蓝→青→黄 渐变色（viridis 简化），t ∈ [0,1]
  const v = Math.max(0, Math.min(1, t));
  const r = Math.round(255 * Math.min(1, Math.max(0, 1.7 * v - 0.2)));
  const g = Math.round(255 * Math.min(1, Math.max(0, 1.5 * v)));
  const b = Math.round(255 * Math.min(1, Math.max(0, 1 - 1.4 * v)));
  return [r, g, b];
}

const MatrixHeatmap = forwardRef<HTMLCanvasElement, Props>(function MatrixHeatmap({ matrix, title }, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
        const [r, g, b] = colorMap(matrix[i][j] / max);
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
      const [r, g, b] = colorMap(s);
      grad.addColorStop(s, `rgb(${r},${g},${b})`);
    }
    ctx.fillStyle = grad;
    ctx.fillRect(lx, ly, 14, lh);
    ctx.strokeStyle = '#ccc';
    ctx.strokeRect(lx, ly, 14, lh);
    ctx.fillStyle = '#555';
    ctx.font = '10px sans-serif';
    ctx.fillText(max.toExponential(2), lx + 18, ly + 4);        // 顶端 = max
    ctx.fillText('0', lx + 18, ly + lh);                        // 底端 = 0
  }, [matrix]);

  function setRefs(el: HTMLCanvasElement | null) {
    canvasRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  }

  return (
    <section>
      {title && <h3>{title}</h3>}
      <canvas
        ref={setRefs}
        width={PAD * 2 + n * CELL + LEGEND_W}
        height={height}
        style={{ border: '1px solid #ddd' }}
      />
    </section>
  );
});

export default MatrixHeatmap;
