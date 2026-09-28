export type FeatureMap = Record<string, number>;

export function normalizeMatrix(G: number[][]): number[][] {
  const total = G.reduce((s, row) => s + row.reduce((a, b) => a + b, 0), 0);
  if (total === 0) return G.map((row) => row.map(() => 0));
  return G.map((row) => row.map((v) => v / total));
}

export function haralickFeatures(G: number[][]): FeatureMap {
  const P = normalizeMatrix(G);
  const n = P.length;
  let mux = 0, muy = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      mux += i * P[i][j];
      muy += j * P[i][j];
    }
  let varx = 0, vary = 0;
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      varx += (i - mux) ** 2 * P[i][j];
      vary += (j - muy) ** 2 * P[i][j];
    }

  let contrast = 0, dissimilarity = 0, homogeneity = 0, asm = 0, entropy = 0,
      maxProb = 0, clusterShade = 0, clusterProminence = 0, inverseDifference = 0,
      sumEntropy = 0;
  const sumProb = new Array(2 * n - 1).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const p = P[i][j];
      if (p === 0) continue;
      const diff = i - j;
      contrast += diff * diff * p;
      dissimilarity += Math.abs(diff) * p;
      homogeneity += p / (1 + diff * diff);
      asm += p * p;
      entropy -= p * Math.log(p);
      if (p > maxProb) maxProb = p;
      const s = i + j - mux - muy;
      clusterShade += s ** 3 * p;
      clusterProminence += s ** 4 * p;
      inverseDifference += p / (1 + Math.abs(diff));
      sumProb[i + j] += p;
    }
  }

  let sumAverage = 0;
  for (let k = 0; k < sumProb.length; k++) {
    sumAverage += k * sumProb[k];
    if (sumProb[k] > 0) sumEntropy -= sumProb[k] * Math.log(sumProb[k]);
  }

  let correlation = 0;
  if (varx * vary > 0) {
    let num = 0;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        num += (i - mux) * (j - muy) * P[i][j];
    correlation = num / Math.sqrt(varx * vary);
  }

  return {
    contrast,
    dissimilarity,
    homogeneity,
    asm,
    entropy,
    correlation,
    mean: (mux + muy) / 2,
    variance: (varx + vary) / 2,
    maxProbability: maxProb,
    clusterShade,
    clusterProminence,
    inverseDifference,
    sumAverage,
    sumEntropy,
  };
}
