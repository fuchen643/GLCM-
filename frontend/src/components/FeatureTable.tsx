import { FEATURE_KEYS } from '../glcm';

const LABELS: Record<string, string> = {
  contrast: '对比度', dissimilarity: '相异性', homogeneity: '同质性',
  asm: '能量/ASM', entropy: '熵', correlation: '相关性', mean: '均值',
  variance: '方差', maxProbability: '最大概率', clusterShade: '聚类阴影',
  clusterProminence: '聚类突出', inverseDifference: '逆差',
  sumAverage: '和平均', sumEntropy: '和熵',
};

export default function FeatureTable({ rows }: { rows: { angle: number; features: Record<string, number> }[] }) {
  if (!rows.length) return null;
  const angles = rows.map((r) => r.angle);
  return (
    <table className="features">
      <thead>
        <tr>
          <th>特征</th>
          {angles.map((a) => <th key={a}>{a}°</th>)}
        </tr>
      </thead>
      <tbody>
        {FEATURE_KEYS.map((k) => (
          <tr key={k}>
            <td>{LABELS[k] ?? k}</td>
            {rows.map((r) => <td key={r.angle}>{r.features[k].toPrecision(6)}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
