import { describe, it, expect } from 'vitest';
import { glcmMatrix } from './glcm';

// 2×2 灰度图 [0,1,1,1]，levels=2
describe('glcmMatrix', () => {
  it('0° 方向非对称', () => {
    const img = new Uint8Array([0, 1, 1, 1]);
    const G = glcmMatrix(img, 2, 2, { levels: 2, distance: 1, angle: 0, symmetric: false });
    expect(G).toEqual([[0, 1], [0, 1]]);
  });
  it('0° 方向对称 = G + G^T', () => {
    const img = new Uint8Array([0, 1, 1, 1]);
    const G = glcmMatrix(img, 2, 2, { levels: 2, distance: 1, angle: 0, symmetric: true });
    expect(G).toEqual([[0, 1], [1, 2]]);
  });
  it('距离越界时跳过', () => {
    const img = new Uint8Array([0, 1, 1, 1]);
    const G = glcmMatrix(img, 2, 2, { levels: 2, distance: 5, angle: 0, symmetric: false });
    const total = G.flat().reduce((a, b) => a + b, 0);
    expect(total).toBe(0);
  });
});
