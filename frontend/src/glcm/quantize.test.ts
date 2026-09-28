import { describe, it, expect } from 'vitest';
import { quantizeGray, quantizeImage } from './quantize';

describe('quantizeGray', () => {
  it('边界值', () => {
    expect(quantizeGray(0, 8)).toBe(0);
    expect(quantizeGray(255, 8)).toBe(7);
    expect(quantizeGray(255, 64)).toBe(63);
  });
  it('中值均匀分箱', () => {
    expect(quantizeGray(127, 8)).toBe(3); // floor(127*8/256)=floor(3.97)=3
    expect(quantizeGray(128, 8)).toBe(4);
  });
});

describe('quantizeImage', () => {
  it('逐像素量化', () => {
    const gray = new Uint8Array([0, 64, 128, 192, 255]);
    expect(Array.from(quantizeImage(gray, 4))).toEqual([0, 1, 2, 3, 3]);
  });
});
