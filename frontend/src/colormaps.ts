// 热力图可选颜色表：以 [r, g, b] 形式返回 0–255 通道值
export type ColormapId = 'viridis' | 'gray' | 'hot' | 'jet';

export interface ColormapDef {
  id: ColormapId;
  label: string;
}

export const COLORMAPS: ColormapDef[] = [
  { id: 'viridis', label: '维里迪斯 (viridis)' },
  { id: 'gray', label: '灰度 (gray)' },
  { id: 'hot', label: '热力图 (hot)' },
  { id: 'jet', label: '彩虹 (jet)' },
];

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// t ∈ [0,1] → [r,g,b]（0–255）
export function colormapAt(id: ColormapId, t: number): [number, number, number] {
  const v = clamp01(t);
  switch (id) {
    case 'gray': {
      const g = Math.round(255 * v);
      return [g, g, g];
    }
    case 'hot':
      return [
        Math.round(255 * clamp01(v * 3)),
        Math.round(255 * clamp01(v * 3 - 1)),
        Math.round(255 * clamp01(v * 3 - 2)),
      ];
    case 'jet': {
      const r = clamp01(1.5 - Math.abs(4 * v - 3));
      const g = clamp01(1.5 - Math.abs(4 * v - 2));
      const b = clamp01(1.5 - Math.abs(4 * v - 1));
      return [Math.round(255 * r), Math.round(255 * g), Math.round(255 * b)];
    }
    case 'viridis':
    default:
      return [
        Math.round(255 * clamp01(1.7 * v - 0.2)),
        Math.round(255 * clamp01(1.5 * v)),
        Math.round(255 * clamp01(1 - 1.4 * v)),
      ];
  }
}
