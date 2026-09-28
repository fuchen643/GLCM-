import { describe, it, expect } from 'vitest';
import { computeGlcmFeatures, FEATURE_KEYS } from './index';
import { rgbaToGray } from './grayscale';

describe('rgbaToGray', () => {
  it('标准亮度公式', () => {
    // R=255,G=255,B=255 → 255
    expect(rgbaToGray(new Uint8ClampedArray([255, 255, 255, 255]), 1, 1)[0]).toBe(255);
    // R=255,G=0,B=0 → round(0.299*255)=round(76.245)=76
    expect(rgbaToGray(new Uint8ClampedArray([255, 0, 0, 255]), 1, 1)[0]).toBe(76);
  });
});

describe('computeGlcmFeatures', () => {
  it('端到端：2×2 图输出矩阵与特征', () => {
    const gray = new Uint8Array([0, 255, 255, 255]); // levels=2 时 255→1，量化得 [0,1,1,1]
    const r = computeGlcmFeatures(gray, 2, 2, { levels: 2, distance: 1, angle: 0, symmetric: true });
    // 对称矩阵 G=[[0,1],[1,2]]，归一化 P=[[0,.25],[.25,.5]]
    expect(r.matrix[0][1]).toBeCloseTo(0.25, 9);
    expect(r.features.contrast).toBeCloseTo(0.5, 9); // Σ(i-j)²p = .25+.25 = 0.5
  });
  it('FEATURE_KEYS 顺序正确', () => {
    expect(FEATURE_KEYS).toEqual([
      'contrast', 'dissimilarity', 'homogeneity', 'asm', 'entropy', 'correlation',
      'mean', 'variance', 'maxProbability', 'clusterShade', 'clusterProminence',
      'inverseDifference', 'sumAverage', 'sumEntropy',
    ]);
  });
});
