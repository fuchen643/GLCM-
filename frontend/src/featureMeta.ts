// 14 项 Haralick 特征的中文名称、含义与公式（UI 展示用元数据）

export const FEATURE_LABELS: Record<string, string> = {
  contrast: '对比度',
  dissimilarity: '相异性',
  homogeneity: '同质性',
  asm: '能量 / 角二阶矩',
  entropy: '熵',
  correlation: '相关性',
  mean: '均值',
  variance: '方差',
  maxProbability: '最大概率',
  clusterShade: '聚类阴影',
  clusterProminence: '聚类突出',
  inverseDifference: '逆差',
  sumAverage: '和平均',
  sumEntropy: '和熵',
};

export const FEATURE_DESC: Record<string, string> = {
  contrast: '反映纹理沟纹深浅与图像清晰度，值越大纹理越清晰、灰度对比越强烈。',
  dissimilarity: '与对比度类似，用 |i−j| 度量灰度差异，对亮度突变更平滑。',
  homogeneity: '衡量灰度分布均匀程度，纹理越均匀值越接近 1。',
  asm: '反映灰度分布均匀性与纹理粗细，值越大纹理越均匀。',
  entropy: '灰度分布随机性与复杂度，值越大纹理越复杂、信息量越大。',
  correlation: '灰度沿某方向的线性相关程度，反映纹理的方向性。',
  mean: '灰度平均强度（亮度均值）。',
  variance: '灰度变化剧烈程度，值越大明暗起伏越明显。',
  maxProbability: '矩阵中最大元素值，反映最强灰度对出现的概率。',
  clusterShade: '矩阵元素关于均值的不对称性（偏度）。',
  clusterProminence: '矩阵元素的峰度，反映纹理突出的尖锐程度。',
  inverseDifference: '与同质性类似，衡量局部均匀性，对灰度差异小的像素对更敏感。',
  sumAverage: '灰度对之和的平均，反映整体亮度水平。',
  sumEntropy: '灰度对之和分布的熵，反映灰度对之和的随机性。',
};

export const FEATURE_FORMULA: Record<string, string> = {
  contrast: 'Σ (i−j)² · p(i,j)',
  dissimilarity: 'Σ |i−j| · p(i,j)',
  homogeneity: 'Σ p(i,j) / (1+(i−j)²)',
  asm: 'Σ p(i,j)²',
  entropy: '−Σ p(i,j) · ln p(i,j)',
  correlation: 'Σ (i−μx)(j−μy)·p(i,j) / (σx·σy)',
  mean: '(μx + μy) / 2',
  variance: '(σx² + σy²) / 2',
  maxProbability: 'max p(i,j)',
  clusterShade: 'Σ (i+j−μx−μy)³ · p(i,j)',
  clusterProminence: 'Σ (i+j−μx−μy)⁴ · p(i,j)',
  inverseDifference: 'Σ p(i,j) / (1+|i−j|)',
  sumAverage: 'Σ k · pₓ₊ᵧ(k)',
  sumEntropy: '−Σ pₓ₊ᵧ(k) · ln pₓ₊ᵧ(k)',
};
