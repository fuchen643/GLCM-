import { quantizeImage } from './quantize';
import { glcmMatrix, GlcmOptions } from './glcm';
import { haralickFeatures, normalizeMatrix, FeatureMap } from './haralick';

export const FEATURE_KEYS = [
  'contrast', 'dissimilarity', 'homogeneity', 'asm', 'entropy', 'correlation',
  'mean', 'variance', 'maxProbability', 'clusterShade', 'clusterProminence',
  'inverseDifference', 'sumAverage', 'sumEntropy',
] as const;

export interface GlcmResult {
  matrix: number[][];
  features: FeatureMap;
}

export function computeGlcmFeatures(
  gray: Uint8Array,
  width: number,
  height: number,
  opts: GlcmOptions
): GlcmResult {
  const quantized = quantizeImage(gray, opts.levels);
  const G = glcmMatrix(quantized, width, height, opts);
  return { matrix: normalizeMatrix(G), features: haralickFeatures(G) };
}

export type { GlcmOptions, Angle } from './glcm';
export { glcmMatrix } from './glcm';
export { haralickFeatures, normalizeMatrix } from './haralick';
export type { FeatureMap } from './haralick';
export { quantizeGray, quantizeImage } from './quantize';
export { rgbaToGray } from './grayscale';
