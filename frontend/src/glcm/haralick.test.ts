import { describe, it, expect } from 'vitest';
import { haralickFeatures, normalizeMatrix } from './haralick';

const LN2 = Math.log(2);

describe('normalizeMatrix', () => {
  it('归一化到总和为 1', () => {
    const P = normalizeMatrix([[0, 1], [0, 1]]);
    expect(P[0][1]).toBeCloseTo(0.5, 9);
    expect(P.flat().reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
  });
});

describe('haralickFeatures', () => {
  it('G=[[0,1],[0,1]] 的 14 项特征（黄金值）', () => {
    const f = haralickFeatures([[0, 1], [0, 1]]);
    expect(f.contrast).toBeCloseTo(0.5, 9);
    expect(f.dissimilarity).toBeCloseTo(0.5, 9);
    expect(f.homogeneity).toBeCloseTo(0.75, 9);
    expect(f.asm).toBeCloseTo(0.5, 9);
    expect(f.entropy).toBeCloseTo(LN2, 9);
    expect(f.correlation).toBe(0); // σx·σy = 0 → 0
    expect(f.mean).toBeCloseTo(0.75, 9);
    expect(f.variance).toBeCloseTo(0.125, 9);
    expect(f.maxProbability).toBeCloseTo(0.5, 9);
    expect(f.clusterShade).toBeCloseTo(0, 9);
    expect(f.clusterProminence).toBeCloseTo(0.0625, 9);
    expect(f.inverseDifference).toBeCloseTo(0.75, 9);
    expect(f.sumAverage).toBeCloseTo(1.5, 9);
    expect(f.sumEntropy).toBeCloseTo(LN2, 9);
  });
  it('G=[[1,0],[0,1]] 相关性=1', () => {
    const f = haralickFeatures([[1, 0], [0, 1]]);
    expect(f.correlation).toBeCloseTo(1, 9);
    expect(f.mean).toBeCloseTo(0.5, 9);
    expect(f.variance).toBeCloseTo(0.25, 9);
    expect(f.contrast).toBeCloseTo(0, 9);
  });
});
