export type Angle = 0 | 45 | 90 | 135;

export interface GlcmOptions {
  levels: number;
  distance: number;
  angle: Angle;
  symmetric: boolean;
}

const OFFSETS: Record<Angle, [number, number]> = {
  0: [0, 1],
  45: [1, 1],
  90: [1, 0],
  135: [-1, 1],
};

export function glcmMatrix(
  quantized: Uint8Array,
  width: number,
  height: number,
  opts: GlcmOptions
): number[][] {
  const { levels, distance, angle, symmetric } = opts;
  const [ux, uy] = OFFSETS[angle];
  const dx = ux * distance;
  const dy = uy * distance;
  const G: number[][] = Array.from({ length: levels }, () => new Array(levels).fill(0));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const i = quantized[y * width + x];
      const j = quantized[ny * width + nx];
      G[i][j] += 1;
      if (symmetric) G[j][i] += 1;
    }
  }
  return G;
}
